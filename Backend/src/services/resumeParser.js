import { z } from "zod";
import { parseResumeText } from "./resumeRules.js";
import { generateJSON } from "./ollamaService.js";
import { EMBED_MODEL } from "./EmbeddingService.js";
import { inferSkills } from "./semanticSkillService.js";
import { mentions, normalizeSkills } from "../utils/text.js";

export const ResumeExtractionSchema = z.object({
  name: z.string().catch(""),
  email: z.string().catch(""),

  phone: z.string().catch(""),

  title: z.string().catch(""),

  skills: z.array(z.string()).catch([]),

  experienceYears: z.coerce.number().min(0).max(60).catch(0),

  education: z.array(
    z.object({
      degree: z.string().catch(""),
      institution: z.string().catch(""),
      year: z.string().catch("")
    })
  ).catch([]),

  projects: z.array(
    z.object({
      name: z.string().catch(""),
      description: z.string().catch(""),
      technologies: z.array(z.string()).catch([])
    })
  ).catch([]),

  certifications: z.array(z.string()).catch([])
});

export async function extractResumeWithAI(text) {
  const prompt = `
Extract structured information from the following resume.

Rules:

1. Do not invent information.
2. If a field is missing, return an empty value.
3. Skills should contain actual technologies, tools,
   frameworks, databases, languages and relevant technical skills.
4. experienceYears should be a numeric estimate only when
   the resume provides enough information.
5. Keep project descriptions concise.
6. Return exactly this JSON structure:

{
  "name": "",
  "email": "",
  "phone": "",
  "title": "",
  "skills": [],
  "experienceYears": 0,
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],
  "certifications": []
}

RESUME:

${text}
`;

  return generateJSON(prompt, ResumeExtractionSchema);
}

function educationSummary(education) {
  return education
    .map(({ degree, institution, year }) =>
      [degree, institution, year].filter(Boolean).join(" - ")
    )
    .filter(Boolean)
    .join("; ");
}

async function rulesOnlyResult(rules, text = "") {
  const skillDetails = rules.skills.map((name) => ({
    name,
    source: "explicit",
    confidence: 1,
    evidence: "Found in resume text",
  }));

  const inferred = text
    ? await enrichWithSemanticSkills(text, rules.skills)
    : [];

  return {
    forStorage: { ...rules, skillDetails: [...skillDetails, ...inferred] },
    structured: {
      name: "",
      email: "",
      phone: "",
      title: "",
      skills: rules.skills,
      experienceYears: rules.experience,
      education: [],
      projects: [],
      certifications: [],
    },
    explicitSkills: rules.skills,
    aiSkills: [],
    meta: {
      parser: inferred.length ? "rules+semantic" : "rules-only",
      embeddingModel: inferred.length ? EMBED_MODEL : "",
      fallback: true,
    },
  };
}

async function enrichWithSemanticSkills(text, explicit, aiInferred = []) {
  const known = new Set();
  const inferred = [];

  for (const skill of aiInferred) {
    if (!known.has(skill)) {
      known.add(skill);
      inferred.push({
        name: skill,
        source: "inferred",
        confidence: 0.5,
        evidence: "Suggested by structured extraction; not explicitly verified.",
      });
    }
  }

  try {
    const semantic = await inferSkills(text, { explicit });
    for (const detail of semantic) {
      if (!known.has(detail.name)) {
        known.add(detail.name);
        inferred.push(detail);
      }
    }
  } catch (error) {
    console.warn("Semantic skill inference unavailable:", error.message);
  }

  return inferred;
}

export async function parseResume(text) {
  const rules = parseResumeText(text);

  if (!String(text).trim()) {
    return rulesOnlyResult(rules);
  }

  try {
    const ai = await extractResumeWithAI(text);

    const aiSkills = normalizeSkills(ai.skills);
    const verified = aiSkills.filter((skill) => mentions(text, skill));
    const unverified = aiSkills.filter((skill) => !verified.includes(skill));
    const skills = [...new Set([...rules.skills, ...verified])];
    const explicitDetails = skills.map((name) => ({
      name,
      source: "explicit",
      confidence: 1,
      evidence: "Found in resume text",
    }));
    const inferred = await enrichWithSemanticSkills(text, skills, unverified);
    const aiExperience = Math.min(Math.max(Number(ai.experienceYears) || 0, 0), 40);
    const experience = rules.experience || aiExperience;
    const experienceNeedsReview =
      rules.experienceNeedsReview || ai.experienceYears > 20 ||
      (rules.experience > 0 && Math.abs(rules.experience - aiExperience) > 8);

    return {
      forStorage: {
        skills,
        experience,
        education: rules.education || educationSummary(ai.education),
        experienceNeedsReview,
        skillDetails: [...explicitDetails, ...inferred],
      },

      structured: {
        ...ai,
        skills,
      },

      explicitSkills: skills,

      aiSkills,

      meta: {
        parser: "rules+qwen",
        model: process.env.OLLAMA_MODEL || "qwen3:8b",
        embeddingModel: EMBED_MODEL,
        fallback: false
      }
    };
  } catch (error) {
    console.error(
      "Qwen resume extraction failed:",
      error.message
    );

    return rulesOnlyResult(rules, text);
  }
}
