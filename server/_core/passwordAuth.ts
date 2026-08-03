import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { createSessionToken, LOCAL_OWNER_OPEN_ID } from "./session";

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function passwordDigest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function passwordsMatch(submitted: string, configured: string) {
  return timingSafeEqual(passwordDigest(submitted), passwordDigest(configured));
}

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getActiveAttempt(clientKey: string) {
  const attempt = failedAttempts.get(clientKey);
  if (attempt && attempt.resetAt <= Date.now()) {
    failedAttempts.delete(clientKey);
    return undefined;
  }
  return attempt;
}

function assertNotRateLimited(clientKey: string) {
  const attempt = getActiveAttempt(clientKey);
  if (attempt && attempt.count >= MAX_FAILED_ATTEMPTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "登录失败次数过多，请 15 分钟后再试",
    });
  }
}

function recordFailedAttempt(clientKey: string) {
  const attempt = getActiveAttempt(clientKey);
  failedAttempts.set(clientKey, {
    count: (attempt?.count ?? 0) + 1,
    resetAt: attempt?.resetAt ?? Date.now() + ATTEMPT_WINDOW_MS,
  });
}

export async function signInWithPassword(
  password: string,
  req: Request,
  res: Response,
) {
  const appPassword = process.env.APP_PASSWORD ?? "";
  const appUserName = process.env.APP_USER_NAME?.trim() || "Owner";

  if (appPassword.length < 12) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "APP_PASSWORD 必须至少包含 12 个字符",
    });
  }

  const clientKey = getClientKey(req);
  assertNotRateLimited(clientKey);

  if (!passwordsMatch(password, appPassword)) {
    recordFailedAttempt(clientKey);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "密码不正确",
    });
  }

  failedAttempts.delete(clientKey);

  await db.upsertUser({
    openId: LOCAL_OWNER_OPEN_ID,
    name: appUserName,
    loginMethod: "password",
    role: "admin",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(LOCAL_OWNER_OPEN_ID);
  if (!user) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "数据库尚未配置或迁移",
    });
  }

  const token = await createSessionToken(LOCAL_OWNER_OPEN_ID, appUserName);
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}
