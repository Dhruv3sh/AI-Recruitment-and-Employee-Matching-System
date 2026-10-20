import test from "node:test";
import assert from "node:assert/strict";
import { applicationReadiness } from "../src/services/applicationReadiness.js";

const candidate = {
  profile: {
    title: "Frontend engineer",
    location: "Delhi",
    education: "MCA",
    skills: ["react"],
    experience: 0,
  },
};

test("application requires a complete profile and processed latest resume", () => {
  assert.equal(applicationReadiness(candidate, null).ready, false);
  assert.equal(applicationReadiness(candidate, { parsingStatus: "pending", storedFileName: "resume.pdf" }).ready, false);
  assert.equal(applicationReadiness(candidate, { parsingStatus: "complete", storedFileName: "resume.pdf" }).ready, true);
});

test("application readiness identifies missing profile fields", () => {
  const result = applicationReadiness({ profile: { ...candidate.profile, education: "" } }, null);

  assert.equal(result.ready, false);
  assert.match(result.message, /education/i);
});
