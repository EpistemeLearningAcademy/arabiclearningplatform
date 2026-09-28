import assert from "node:assert/strict";
import { test } from "node:test";
import { scopeMatches } from "./authorization.js";

test("authorization scopes require an exact target or explicit ancestor", () => {
  const target = { type: "CAMPUS" as const, id: "campus-a", schoolId: "school-a" };
  assert.equal(scopeMatches({ scopeType: "CAMPUS", scopeId: "campus-a" }, target, "user-a"), true);
  assert.equal(scopeMatches({ scopeType: "CAMPUS", scopeId: "campus-b" }, target, "user-a"), false);
  assert.equal(scopeMatches({ scopeType: "SCHOOL", scopeId: "school-a" }, target, "user-a"), true);
  assert.equal(scopeMatches({ scopeType: "SCHOOL", scopeId: "school-b" }, target, "user-a"), false);
  assert.equal(scopeMatches({ scopeType: "PLATFORM", scopeId: null }, target, "user-a"), true);
});

test("self scope resolves only to the authenticated user", () => {
  const target = { type: "SELF" as const };
  assert.equal(scopeMatches({ scopeType: "SELF", scopeId: "user-a" }, target, "user-a"), true);
  assert.equal(scopeMatches({ scopeType: "SELF", scopeId: "user-b" }, target, "user-a"), false);
});

test("transport run assignments are limited to the assigned run", () => {
  const target = { type: "TRANSPORT_RUN" as const, id: "run-1" };
  assert.equal(scopeMatches({ scopeType: "TRANSPORT_RUN", scopeId: "run-1" }, target, "driver"), true);
  assert.equal(scopeMatches({ scopeType: "TRANSPORT_RUN", scopeId: "run-2" }, target, "driver"), false);
});

