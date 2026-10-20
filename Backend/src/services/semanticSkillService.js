import { taxonomyEntries } from "../utils/skills.js";
import {
  embedMany,
  dot
} from "./EmbeddingService.js";

let indexPromise;

function skillIndex() {
  indexPromise ??= (async () => {
    const entries = taxonomyEntries();

    const vectors = await embedMany(
      entries.map(
        ([name, { category }]) =>
          `${name}, ${category} technology`
      )
    );

    return entries.map(([name], index) => ({
      name,
      vector: vectors[index]
    }));
  })().catch((error) => {
    indexPromise = undefined;
    throw error;
  });

  return indexPromise;
}

export async function inferSkills(
  text,
  {
    explicit = [],
    threshold = 0.50
  } = {}
) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 25 &&
        line.length < 400
    )
    .slice(0, 80);

  if (!lines.length) {
    return [];
  }

  const [index, vectors] = await Promise.all([
    skillIndex(),
    embedMany(lines)
  ]);

  const best = new Map();

  vectors.forEach((vector, lineIndex) => {
    for (const skill of index) {
      if (explicit.includes(skill.name)) {
        continue;
      }

      const similarity = dot(
        vector,
        skill.vector
      );

      if (
        similarity >= threshold &&
        similarity >
          (best.get(skill.name)?.confidence ?? 0)
      ) {
        best.set(skill.name, {
          name: skill.name,
          source: "inferred",
          confidence: Number(
            similarity.toFixed(2)
          ),
          evidence: lines[lineIndex].slice(
            0,
            300
          )
        });
      }
    }
  });

  return [...best.values()]
    .sort(
      (a, b) =>
        b.confidence - a.confidence
    )
    .slice(0, 15);
}