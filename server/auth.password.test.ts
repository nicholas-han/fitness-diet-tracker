import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("./_core/session", () => ({
  createSessionToken: vi.fn(),
  LOCAL_OWNER_OPEN_ID: "self-hosted-owner",
}));

import * as db from "./db";
import { passwordsMatch, signInWithPassword } from "./_core/passwordAuth";
import { createSessionToken } from "./_core/session";

function createRequest(ip: string): Request {
  return {
    ip,
    protocol: "https",
    headers: {},
    socket: {},
  } as Request;
}

function createResponse() {
  return {
    cookie: vi.fn(),
  } as unknown as Response;
}

const owner: User = {
  id: 1,
  openId: "self-hosted-owner",
  name: "Owner",
  email: null,
  loginMethod: "password",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("password authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_PASSWORD = "a-secure-test-password";
    process.env.APP_USER_NAME = "Owner";
    vi.mocked(db.getUserByOpenId).mockResolvedValue(owner);
    vi.mocked(createSessionToken).mockResolvedValue("signed-session-token");
  });

  it("compares passwords without exposing the configured value", () => {
    expect(passwordsMatch("correct horse", "correct horse")).toBe(true);
    expect(passwordsMatch("correct horse", "wrong horse")).toBe(false);
  });

  it("creates the local owner and sets an HTTP-only session cookie", async () => {
    const req = createRequest("198.51.100.10");
    const res = createResponse();

    await signInWithPassword("a-secure-test-password", req, res);

    expect(db.upsertUser).toHaveBeenCalledWith(expect.objectContaining({
      openId: "self-hosted-owner",
      loginMethod: "password",
      role: "admin",
    }));
    expect(createSessionToken).toHaveBeenCalledWith("self-hosted-owner", "Owner");
    expect(res.cookie).toHaveBeenCalledWith(
      "app_session_id",
      "signed-session-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      }),
    );
  });

  it("rejects an incorrect password before accessing the database", async () => {
    const req = createRequest("198.51.100.11");
    const res = createResponse();

    await expect(signInWithPassword("incorrect-password", req, res))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.upsertUser).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("requires a password with at least 12 characters", async () => {
    process.env.APP_PASSWORD = "too-short";

    await expect(signInWithPassword(
      "too-short",
      createRequest("198.51.100.12"),
      createResponse(),
    )).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
