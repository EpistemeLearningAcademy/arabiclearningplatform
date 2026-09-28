import assert from "node:assert/strict";
import { test } from "node:test";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./auth.js";

test("password hashes verify only the matching password", async () => {
  const hash = await hashPassword("a-long-test-password");
  assert.notEqual(hash, "a-long-test-password");
  assert.equal(await verifyPassword("a-long-test-password", hash), true);
  assert.equal(await verifyPassword("a-different-password", hash), false);
});

test("malformed password hashes are rejected safely", async () => {
  assert.equal(await verifyPassword("password", "not-a-hash"), false);
  assert.equal(await verifyPassword("password", "00:00"), false);
});

test("session token generation is random and only a digest is stored", () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
  const digest = hashSessionToken(first);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.notEqual(digest, first);
  assert.equal(hashSessionToken(first), digest);
});

