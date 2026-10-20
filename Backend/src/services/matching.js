import { HYBRID_VERSION, RULES_VERSION, WEIGHTS } from "../config/matching.js";
import { Job } from "../models/Job.js";
import { MatchResult } from "../models/MatchResult.js";
import { User } from "../models/User.js";
import { normalizeSkills, titleCase } from "../utils/text.js";
import {
  EMBED_MODEL,
  calibrate,
  candidateText,
  dot,
  ensureEmbedding,
  jobText,
} from "./EmbeddingService.js";

const pct = (value) => (value == null ? null : Math.round(value * 100));

function educationFraction(candidateEducation, requiredEducation) {
  if (!requiredEducation?.trim()) return 1;
  if (!candidateEducation?.trim()) return 0;

  const candidate = candidateEducation.toLowerCase();
  const required = requiredEducation.toLowerCase();
  return candidate.includes(required) || required.includes(candidate) ? 1 : 0;
}

function explanationFor({ matchedSkills, missingSkills, experienceFraction, educationFraction: education }) {
  const matched = matchedSkills.length
    ? `Matches ${matchedSkills.map(titleCase).join(", ")}.`
    : "No required skills are currently matched.";
  const missing = missingSkills.length
    ? ` Missing: ${missingSkills.map(titleCase).join(", ")}.`
    : "";
  const experience = experienceFraction < 1 ? " Experience is below the requirement." : "";
  const educationText = education < 1 ? " Education requirement is not confirmed." : "";
  return `${matched}${missing}${experience}${educationText}`;
}

export function calculateMatch(candidate, job) {
  const candidateSkills = new Set(normalizeSkills(candidate.profile?.skills));
  const requiredSkills = normalizeSkills(job.requirements?.skills);
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.has(skill));
  const skills = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 1;

  const requiredExperience = Math.max(0, Number(job.requirements?.experience || 0));
  const candidateExperience = Math.max(0, Number(candidate.profile?.experience || 0));
  const experience = requiredExperience
    ? Math.min(candidateExperience / requiredExperience, 1)
    : 1;
  const education = educationFraction(
    candidate.profile?.education,
    job.requirements?.education,
  );
  const fractions = { skills, experience, education };
  const score = Math.round(
    skills * WEIGHTS.rules.skills +
      experience * WEIGHTS.rules.experience +
      education * WEIGHTS.rules.education,
  );

  return {
    score,
    rulesScore: score,
    breakdown: {
      skills: pct(skills),
      experience: pct(experience),
      education: pct(education),
      semantic: null,
    },
    scoring: {
      skills: Math.round(skills * WEIGHTS.rules.skills),
      experience: Math.round(experience * WEIGHTS.rules.experience),
      education: Math.round(education * WEIGHTS.rules.education),
    },
    matchedSkills,
    missingSkills,
    explanation: explanationFor({
      matchedSkills,
      missingSkills,
      experienceFraction: experience,
      educationFraction: education,
    }),
    matchingVersion: RULES_VERSION,
    semantic: null,
    _components: { fractions },
  };
}

export async function calculateHybridMatch(candidate, job) {
  const base = calculateMatch(candidate, job);
  let semantic = null;

  try {
    const [candidateVector, jobVector] = await Promise.all([
      ensureEmbedding(candidate, candidateText(candidate)),
      ensureEmbedding(job, jobText(job)),
    ]);
    semantic = calibrate(dot(candidateVector, jobVector));
  } catch (error) {
    console.warn("Semantic score unavailable:", error.message);
  }

  return calculateHybridScore(base, semantic);
}

export function calculateHybridScore(base, semantic) {
  const { fractions } = base._components;
  const weights = WEIGHTS.hybrid;
  const parts = {
    skills: fractions.skills * weights.skills,
    experience: fractions.experience * weights.experience,
    education: fractions.education * weights.education,
    ...(semantic != null && { semantic: semantic * weights.semantic }),
  };
  const availableWeight = Object.keys(parts).reduce(
    (sum, key) => sum + weights[key],
    0,
  );
  const score = Math.round(
    (Object.values(parts).reduce((sum, value) => sum + value, 0) / availableWeight) * 100,
  );

  return {
    ...base,
    score,
    hybridScore: score,
    semantic,
    scoring: Object.fromEntries(
      Object.entries(parts).map(([key, value]) => [key, Math.round(value)]),
    ),
    breakdown: {
      skills: pct(fractions.skills),
      experience: pct(fractions.experience),
      education: pct(fractions.education),
      semantic: pct(semantic),
    },
    matchingVersion: HYBRID_VERSION,
    aiMeta: { embeddingModel: EMBED_MODEL, semanticAvailable: semantic != null },
  };
}

async function storeMatch(candidate, job) {
  const useHybrid = (process.env.MATCH_MODE || "hybrid") === "hybrid";
  const { _components, ...result } = useHybrid
    ? await calculateHybridMatch(candidate, job)
    : calculateMatch(candidate, job);

  return MatchResult.findOneAndUpdate(
    { candidate: candidate._id, job: job._id },
    { candidate: candidate._id, job: job._id, ...result },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function inBatches(items, size, action) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(action));
  }
}

export async function refreshCandidateMatches(candidate) {
  const jobs = await Job.find({ status: "open" }).select("+embedding.vector");
  if ((process.env.MATCH_MODE || "hybrid") === "hybrid") {
    try {
      await ensureEmbedding(candidate, candidateText(candidate));
    } catch (error) {
      console.warn("Candidate embedding unavailable:", error.message);
    }
  }
  await inBatches(jobs, 5, (job) => storeMatch(candidate, job));
}

export async function refreshJobMatches(job) {
  const [storedJob, candidates] = await Promise.all([
    Job.findById(job._id).select("+embedding.vector"),
    User.find({ role: "candidate" }).select("+embedding.vector"),
  ]);
  if (!storedJob) return;
  if ((process.env.MATCH_MODE || "hybrid") === "hybrid") {
    try {
      await ensureEmbedding(storedJob, jobText(storedJob));
    } catch (error) {
      console.warn("Job embedding unavailable:", error.message);
    }
  }
  await inBatches(candidates, 5, (candidate) => storeMatch(candidate, storedJob));
}
