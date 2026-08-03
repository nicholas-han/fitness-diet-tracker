import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import type { User } from "../drizzle/schema";

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import * as db from "./db";
import {
  authenticateRequest,
  createSessionToken,
  LOCAL_OWNER_OPEN_ID,
} from "./_core/session";

const owner: User = {
  id: 1,
  openId: LOCAL_OWNER_OPEN_ID,
  name: "Owner",
  email: null,
  loginMethod: "password",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function requestWithToken(token: string): Request {
  return {
    headers: { cookie: `app_session_id=${token}` },
  } as Request;
}

describe("signed sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-that-is-longer-than-thirty-two-characters";
    vi.mocked(db.getUserByOpenId).mockResolvedValue(owner);
  });

  it("authenticates a valid signed cookie", async () => {
    const token = await createSessionToken(LOCAL_OWNER_OPEN_ID, "Owner");

    await expect(authenticateRequest(requestWithToken(token))).resolves.toEqual(owner);
    expect(db.getUserByOpenId).toHaveBeenCalledWith(LOCAL_OWNER_OPEN_ID);
  });

  it("rejects a tampered cookie", async () => {
    const token = await createSessionToken(LOCAL_OWNER_OPEN_ID, "Owner");

    await expect(authenticateRequest(requestWithToken(`${token}tampered`)))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(db.getUserByOpenId).not.toHaveBeenCalled();
  });

  it("refuses to sign sessions with a short secret", async () => {
    process.env.JWT_SECRET = "too-short";

    await expect(createSessionToken(LOCAL_OWNER_OPEN_ID, "Owner"))
      .rejects.toThrow("JWT_SECRET must contain at least 32 characters");
  });
});
