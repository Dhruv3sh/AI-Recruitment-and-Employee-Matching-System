export function applicationReadiness(candidate, resume) {
  const profile = candidate?.profile || {};
  const missing = [];
  if (!profile.title?.trim()) missing.push("target role");
  if (!profile.location?.trim()) missing.push("location");
  if (!profile.education?.trim()) missing.push("education");
  if (!Array.isArray(profile.skills) || !profile.skills.length) missing.push("skills");
  if (!Number.isFinite(Number(profile.experience)) || Number(profile.experience) < 0) {
    missing.push("experience");
  }
  if (missing.length) {
    return { ready: false, message: `Complete your profile: add ${missing.join(", ")}.` };
  }
  if (!resume) {
    return { ready: false, message: "Upload a resume before applying." };
  }
  if (resume.parsingStatus === "pending") {
    return { ready: false, message: "Wait for your latest resume to finish processing before applying." };
  }
  if (resume.parsingStatus !== "complete" || !resume.storedFileName) {
    return { ready: false, message: "Upload a successfully processed resume before applying." };
  }
  return { ready: true, message: "" };
}
