import { knownSkillNames, canonicalSkill } from "../utils/skills.js";
import { mentions, normalizeSkills } from "../utils/text.js";

const DEGREE_PATTERN = /\b(?:Ph\.?D\.?|Doctorate|M\.?Tech|M\.?Sc|M\.?C\.?A|MBA|Master(?:'s)?|B\.?Tech|B\.?E\.?|B\.?Sc|B\.?C\.?A|Bachelor(?:'s)?|Diploma)\b/gi;

function educationRank(value) {
  if (/Ph\.?D|Doctorate/i.test(value)) return 6;
  if (/M\.?Tech|M\.?Sc|M\.?C\.?A|MBA|Master/i.test(value)) return 5;
  if (/B\.?Tech|B\.?E\.?|B\.?Sc|B\.?C\.?A|Bachelor/i.test(value)) return 4;
  return 3;
}

export function cleanEducationLabel(value = "") {
  return value
    // Scores are not an education credential and commonly follow a degree in resumes.
    .replace(
      /\b(?:cgpa|gpa|percentage|percent|marks?)\b\s*[:=-]?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?\s*%?.*$/i,
      "",
    )
    .replace(/[()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s,;|–-]+$/, "")
    .trim();
}

function extractEducation(source) {
  const degrees = [...source.matchAll(DEGREE_PATTERN)];
  const entries = degrees.map((match, index) => {
    const start = match.index;
    const nextDegree = degrees[index + 1]?.index ?? source.length;
    const lineEnd = source.indexOf("\n", start);
    const end = Math.min(nextDegree, lineEnd === -1 ? source.length : lineEnd);
    const value = cleanEducationLabel(source.slice(start, end));
    return { value, index: start, rank: educationRank(value) };
  }).filter(({ value }) => value);

  return entries.sort((a, b) => b.rank - a.rank || b.index - a.index)[0]?.value || "";
}

export function parseResumeText(text = "") {
  const source = String(text);
  const skills = [
    ...new Set(knownSkillNames().map(canonicalSkill).filter((skill) => mentions(source, skill))),
  ];
  const rawExperience = Math.max(
    0,
    ...[...source.matchAll(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/gi)].map((match) => Number(match[1])),
  );
  const experience = Math.min(rawExperience, 40);
  const education = extractEducation(source);

  return {
    skills: normalizeSkills(skills),
    experience,
    education: education.trim(),
    experienceNeedsReview: rawExperience > 20,
  };
}
