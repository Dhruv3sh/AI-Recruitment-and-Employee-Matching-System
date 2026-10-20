function hasValue(value) {
  return typeof value === "string" ? Boolean(value.trim()) : value != null;
}

export function getApplicationReadiness(profile = {}, resumes = []) {
  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter(Boolean)
    : String(profile.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean);
  const missing = [];
  if (!hasValue(profile.title)) missing.push("target role");
  if (!hasValue(profile.location)) missing.push("location");
  if (!hasValue(profile.education)) missing.push("education");
  if (!skills.length) missing.push("skills");
  if (!Number.isFinite(Number(profile.experience)) || Number(profile.experience) < 0) missing.push("experience");
  if (missing.length) return { ready: false, message: `Complete your profile: add ${missing.join(", ")}.` };

  const latestResume = [...resumes].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  )[0];
  if (!latestResume) return { ready: false, message: "Upload a resume before applying." };
  if (latestResume.parsingStatus === "pending") return { ready: false, message: "Wait for your latest resume to finish processing before applying." };
  if (latestResume.parsingStatus !== "complete") return { ready: false, message: "Upload a successfully processed resume before applying." };
  return { ready: true, message: "" };
}
