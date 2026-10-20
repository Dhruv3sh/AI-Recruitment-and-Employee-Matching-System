export function initials(name = "M") {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function labelSkill(skill) {
  return String(skill).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const emptyProfile = {
  title: "",
  location: "",
  experience: 0,
  skills: "",
  education: "",
};
export const emptyJob = {
  title: "",
  company: "",
  location: "",
  experience: 0,
  skills: "",
  description: "",
};
