import test from "node:test";
import assert from "node:assert/strict";
import { parseResumeText } from "../src/services/resumeRules.js";

test("parseResumeText extracts deterministic matching signals", () => {
  const result = parseResumeText(
    "React developer with 3 years of JavaScript and MongoDB experience. B.Tech Computer Science",
  );

  assert.deepEqual(
    new Set(result.skills),
    new Set(["javascript", "react", "mongodb"]),
  );
  assert.equal(result.experience, 3);
  assert.equal(result.education, "B.Tech Computer Science");
});

test("parseResumeText resolves skill aliases without matching ambiguous shorthand", () => {
  const result = parseResumeText("Built APIs with NodeJS and ReactJS for 2 years.");

  assert.ok(result.skills.includes("node.js"));
  assert.ok(result.skills.includes("react"));
});

test("parseResumeText recognizes MCA as education", () => {
  const result = parseResumeText("Completed MCA Computer Science in 2024.");

  assert.equal(result.education, "MCA Computer Science in 2024.");
});

test("parseResumeText prefers the highest qualification when several degrees exist", () => {
  const result = parseResumeText("B.Tech Computer Science, 2021\nMCA, Computer Applications, 2024");

  assert.equal(result.education, "MCA, Computer Applications, 2024");
});

test("parseResumeText excludes brackets and CGPA from education", () => {
  const result = parseResumeText("Master of Computer Applications (MCA) CGPA 7.6");

  assert.equal(result.education, "MCA");
});
