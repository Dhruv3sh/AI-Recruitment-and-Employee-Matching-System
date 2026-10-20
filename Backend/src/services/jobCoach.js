import { z } from "zod";
import { generateJSON, isOllamaAvailable } from "./ollamaService.js";

const JobCoachSchema = z.object({
  summary: z.string().catch(""),
  suggestions: z.array(z.object({
    skill: z.string().catch(""),
    rationale: z.string().catch(""),
  })).max(5).catch([]),
});

export function fallbackJobCoach(missingSkills = []) {
  const suggestions = missingSkills.slice(0, 5).map((skill) => ({
    skill,
    rationale: `Add ${skill} only if you can support it with genuine project, course, or work evidence.`,
  }));

  return {
    summary: suggestions.length
      ? "Strengthen your profile with skills that are relevant to this role and that you can honestly demonstrate."
      : "Your saved skills cover the requirements currently used for this match.",
    suggestions,
    source: "matching",
  };
}

export async function createJobCoach({ job, candidate, missingSkills }) {
  const fallback = fallbackJobCoach(missingSkills);
  if (!fallback.suggestions.length || !(await isOllamaAvailable())) return fallback;

  try {
    const response = await generateJSON(
      `
You are a careful career coach.

Give practical, concise advice for a candidate considering this job. Only discuss the missing skills supplied below. Never tell the candidate to claim a skill they do not have. Suggest adding a skill only when they can truthfully support it with project, course, certification, or work evidence.

Candidate role: ${candidate.profile?.title || "Not specified"}
Candidate skills: ${(candidate.profile?.skills || []).join(", ") || "Not specified"}
Job title: ${job.title}
Job description: ${job.description || "Not provided"}
Missing job skills: ${missingSkills.join(", ")}

Return a short summary and one short rationale for each missing skill.`,
      JobCoachSchema,
    );

    const rationaleBySkill = new Map(
      response.suggestions.map((item) => [item.skill.toLowerCase(), item.rationale]),
    );
    return {
      summary: response.summary || fallback.summary,
      suggestions: fallback.suggestions.map((item) => ({
        ...item,
        rationale: rationaleBySkill.get(item.skill.toLowerCase()) || item.rationale,
      })),
      source: "qwen",
    };
  } catch (error) {
    console.warn("Job coach fallback:", error.message);
    return fallback;
  }
}
