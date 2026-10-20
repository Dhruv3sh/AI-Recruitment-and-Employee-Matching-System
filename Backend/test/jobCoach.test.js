import test from "node:test";
import assert from "node:assert/strict";
import { fallbackJobCoach } from "../src/services/jobCoach.js";

test("fallback job coach keeps suggestions within missing skills", () => {
  const coach = fallbackJobCoach(["react", "typescript"]);

  assert.deepEqual(coach.suggestions.map((item) => item.skill), ["react", "typescript"]);
  assert.match(coach.suggestions[0].rationale, /genuine project/i);
});
