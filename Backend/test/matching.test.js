import test from "node:test";
import assert from "node:assert/strict";
import { calculateHybridScore, calculateMatch } from "../src/services/matching.js";

test("calculateMatch weights skills, experience, and optional education", () => {
  const candidate = {
    profile: {
      skills: ["react", "typescript", "javascript"],
      experience: 3,
      education: "B.Tech",
    },
  };
  const job = {
    requirements: { skills: ["react", "typescript", "css"], experience: 2 },
  };
  const result = calculateMatch(candidate, job);
  assert.equal(result.breakdown.skills, 67);
  assert.equal(result.breakdown.experience, 100);
  assert.equal(result.breakdown.education, 100);
  assert.equal(result.breakdown.semantic, null);
  assert.equal(result.score, 80);
});

test("calculateMatch treats zero required experience as fully satisfied", () => {
  const result = calculateMatch(
    { profile: { skills: ["react"], experience: 0, education: "" } },
    { requirements: { skills: ["react"], experience: 0, education: "B.Tech" } },
  );

  assert.equal(result.breakdown.experience, 100);
  assert.equal(result.breakdown.education, 0);
});

test("calculateHybridScore renormalizes when semantic matching is unavailable", () => {
  const base = calculateMatch(
    { profile: { skills: ["react"], experience: 2, education: "B.Tech" } },
    { requirements: { skills: ["react"], experience: 2, education: "B.Tech" } },
  );
  const result = calculateHybridScore(base, null);

  assert.equal(result.score, 100);
  assert.equal(result.semantic, null);
  assert.equal(result.breakdown.semantic, null);
});
