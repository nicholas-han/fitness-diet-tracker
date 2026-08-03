import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

const SESSION_ISSUER = "fitness-diet-tracker";
const SESSION_AUDIENCE = "fitness-diet-tracker-web";
export const LOCAL_OWNER_OPEN_ID = "self-hosted-owner";

function getSessionSecret() {
  const cookieSecret = process.env.JWT_SECRET ?? "";
  if (cookieSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(cookieSecret);
}

export async function createSessionToken(
  openId: string,
  name: string,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);

  return new SignJWT({ name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(openId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

async function verifySession(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (!payload.sub || typeof payload.name !== "string") return null;
    return { openId: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const session = await verifySession(cookies[COOKIE_NAME]);
  if (!session) throw ForbiddenError("Invalid session cookie");

  let user = await db.getUserByOpenId(session.openId);

  if (!user && session.openId === LOCAL_OWNER_OPEN_ID) {
    await db.upsertUser({
      openId: LOCAL_OWNER_OPEN_ID,
      name: session.name,
      loginMethod: "password",
      role: "admin",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(LOCAL_OWNER_OPEN_ID);
  }

  if (!user) throw ForbiddenError("User not found");

  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  });

  return user;
}
