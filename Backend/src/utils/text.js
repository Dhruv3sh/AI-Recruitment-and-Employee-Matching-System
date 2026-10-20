// Backend/src/utils/text.js  (same exports, now taxonomy-aware)
import { canonicalSkill, skillTerms } from "./skills.js";

export function normalizeSkills(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(values.map((v) => canonicalSkill(v)).filter(Boolean))];
}
export function titleCase(value) {
  return String(value).replace(/\b\w/g, (l) => l.toUpperCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentions(text, skill) {
  const source = String(text || "").toLowerCase();
  return skillTerms(skill).some((term) =>
    new RegExp(`(?<![\\w.])${escapeRegExp(term)}(?!\\w)`, "i").test(source),
  );
}
