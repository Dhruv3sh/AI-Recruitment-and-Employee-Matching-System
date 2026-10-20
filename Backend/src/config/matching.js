// Backend/src/config/matching.js
export const RULES_VERSION = "rules-1.1";
export const HYBRID_VERSION = "hybrid-1.0";
export const WEIGHTS = {
  rules: { skills: 60, experience: 25, education: 15 },
  hybrid: { skills: 45, experience: 20, education: 10, semantic: 25 },
};
// cosine calibration: embedding similarities cluster, so stretch them
export const SEMANTIC_RANGE = { floor: 0.15, ceil: 0.65 }; // starting guess, tune on eval set
