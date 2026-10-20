// Backend/src/utils/skills.js  (taxonomy v1, in code; move to a Mongo collection later)
const TAXONOMY = {
  "node.js":    { aliases: ["node", "nodejs", "node js"], category: "backend" },
  "react":      { aliases: ["reactjs", "react.js", "react js"], category: "frontend" },
  "next.js":    { aliases: ["nextjs", "next js"], category: "frontend" },
  "mongodb":    { aliases: ["mongo", "mongo db"], category: "database" },
  "express":    { aliases: ["express.js", "expressjs"], category: "backend" },
  "javascript": { aliases: ["js", "ecmascript"], category: "language" },
  "typescript": { aliases: ["ts"], category: "language" },
  "rest api":   { aliases: ["rest", "restful", "restful api", "rest apis"], category: "backend" },
  "python":     { aliases: ["py"], category: "language" },
  "sql":        { aliases: ["structured query language"], category: "database" },
  "mysql":      { aliases: [], category: "database" },
  "postgresql": { aliases: ["postgres"], category: "database" },
  "css":        { aliases: ["css3"], category: "frontend" },
  "html":       { aliases: ["html5"], category: "frontend" },
  "docker":     { aliases: [], category: "devops" },
  "aws":        { aliases: ["amazon web services"], category: "cloud" },
  "git":        { aliases: ["github"], category: "tools" },
  "figma":      { aliases: [], category: "design" },
  "tableau":    { aliases: [], category: "analytics" },
  "java":       { aliases: [], category: "language" },
};
const ALIAS = new Map();
for (const [canon, { aliases }] of Object.entries(TAXONOMY)) {
  ALIAS.set(canon, canon);
  aliases.forEach((a) => ALIAS.set(a, canon));
}
export const taxonomyEntries = () => Object.entries(TAXONOMY);
export const skillTerms = (skill, { includeAmbiguousAliases = false } = {}) => {
  const canonical = canonicalSkill(skill);
  const entry = TAXONOMY[canonical];
  if (!entry) return [canonical];

  const ambiguous = new Set(["node", "express", "rest", "ts"]);
  return [canonical, ...entry.aliases].filter(
    (term) => includeAmbiguousAliases || !ambiguous.has(term),
  );
};
export const canonicalSkill = (s) => {
  const k = String(s).trim().toLowerCase();
  return ALIAS.get(k) ?? k;
};
export const knownSkillNames = () => [...ALIAS.keys()];
