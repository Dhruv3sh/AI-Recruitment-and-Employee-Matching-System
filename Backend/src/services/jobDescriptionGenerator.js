import { z } from "zod";
import { generateJSON, isOllamaAvailable } from "./ollamaService.js";

const JobDescriptionSchema = z.object({
  description: z.string().trim().min(120).max(5000),
});

export function fallbackJobDescription({
  title,
  company,
  location,
  skills = [],
  experience = 0,
  education = "",
}) {
  const role = title?.trim() || "this role";
  const organization = company?.trim() || "our team";
  const locationLine = location?.trim() ? ` Location: ${location.trim()}.` : "";
  const skillLine = skills.length
    ? `Key skills: ${skills.join(", ")}.`
    : "Key skills and tools will be agreed with the hiring team.";
  const experienceLine = Number(experience) > 0
    ? `Experience: ${Number(experience)}+ years in a relevant role.`
    : "Experience: relevant project, internship, or professional experience is welcome.";
  const educationLine = education?.trim()
    ? `Education: ${education.trim()} or equivalent practical experience.`
    : "Education: relevant training or equivalent practical experience.";

  return `${role}\n\n${organization} is looking for a thoughtful and collaborative ${role}. You will help deliver reliable work, communicate progress clearly, and contribute to a team that values continuous improvement.${locationLine}\n\nResponsibilities\n- Deliver high-quality work aligned with agreed priorities.\n- Collaborate with teammates and stakeholders to solve practical problems.\n- Document decisions and share progress with the team.\n\nWhat we are looking for\n- ${skillLine}\n- ${experienceLine}\n- ${educationLine}\n- Clear communication, ownership, and a willingness to learn.`;
}

export async function createJobDescriptionDraft(details) {
  const fallback = fallbackJobDescription(details);
  if (!(await isOllamaAvailable())) {
    return { description: fallback, source: "template" };
  }

  try {
    const response = await generateJSON(
      `
You are writing a clear, inclusive job description draft for a recruiter to review.

Job title: ${details.title}
Company: ${details.company || "Not provided"}
Location: ${details.location || "Not provided"}
Required skills: ${(details.skills || []).join(", ") || "Not provided"}
Minimum experience: ${Number(details.experience || 0)} years
Education: ${details.education || "Not provided"}

Write plain text only. Include a concise overview, a Responsibilities section, and a What we are looking for section. Use only information supplied above; do not invent salary, benefits, legal requirements, company facts, or promises. Keep it under 450 words. This is a draft the recruiter will edit before publication.
`,
      JobDescriptionSchema,
    );
    return { description: response.description, source: "qwen" };
  } catch (error) {
    console.warn("Job description generation fallback:", error.message);
    return { description: fallback, source: "template" };
  }
}
