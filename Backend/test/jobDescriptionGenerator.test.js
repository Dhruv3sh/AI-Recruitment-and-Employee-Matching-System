import test from "node:test";
import assert from "node:assert/strict";
import { fallbackJobDescription } from "../src/services/jobDescriptionGenerator.js";

test("fallback job description includes supplied role requirements", () => {
  const description = fallbackJobDescription({
    title: "Backend Engineer",
    company: "Matchwise",
    location: "Pune",
    skills: ["node.js", "mongodb"],
    experience: 2,
    education: "B.Tech",
  });

  assert.match(description, /Backend Engineer/);
  assert.match(description, /node\.js, mongodb/);
  assert.match(description, /2\+ years/);
  assert.match(description, /Responsibilities/);
});
