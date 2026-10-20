// Backend/tests/embedding.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { calibrate, dot } from "../src/services/EmbeddingService.js";

test("calibrate clamps to 0..1", () => {
  assert.equal(calibrate(-0.2), 0);
  assert.equal(calibrate(0.95), 1);
});
test("dot of identical unit vectors is 1", () => assert.ok(Math.abs(dot([0.6, 0.8], [0.6, 0.8]) - 1) < 1e-9));