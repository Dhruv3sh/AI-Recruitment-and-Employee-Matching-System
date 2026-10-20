import crypto from "node:crypto";
import { SEMANTIC_RANGE } from "../config/matching.js";

export const EMBED_MODEL =
  process.env.EMBED_MODEL || "Xenova/all-MiniLM-L6-v2";

let extractorPromise;

function getExtractor() {
  extractorPromise ??= import("@huggingface/transformers")
    .then(({ pipeline }) =>
      pipeline("feature-extraction", EMBED_MODEL, {
        dtype: "q8"
      })
    )
    .catch((error) => {
      extractorPromise = undefined;
      throw error;
    });

  return extractorPromise;
}

export function warmUp() {
  return getExtractor();
}

export async function embedMany(texts, batchSize = 32) {
  const extractor = await getExtractor();

  const output = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const result = await extractor(batch, {
      pooling: "mean",
      normalize: true
    });

    output.push(...result.tolist());
  }

  return output;
}

export async function embed(text) {
  const [vector] = await embedMany([text]);

  return vector;
}

export function dot(a, b) {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match");
  }

  let score = 0;

  for (let i = 0; i < a.length; i++) {
    score += a[i] * b[i];
  }

  return score;
}

export function calibrate(score) {
  return Math.min(
    1,
    Math.max(
      0,
      (score - SEMANTIC_RANGE.floor) /
        (SEMANTIC_RANGE.ceil - SEMANTIC_RANGE.floor)
    )
  );
}

export function candidateText(user) {
  return [
    user.profile?.title,
    `Skills: ${(user.profile?.skills || []).join(", ")}`,
    `${user.profile?.experience || 0} years experience`
  ]
    .filter(Boolean)
    .join(". ");
}

export function jobText(job) {
  return [
    job.title,
    `Required skills: ${(job.requirements?.skills || []).join(", ")}`,
    (job.description || "")
      .split(/\s+/)
      .slice(0, 120)
      .join(" ")
  ]
    .filter(Boolean)
    .join(". ");
}

export async function ensureEmbedding(doc, text) {
  const hash = crypto
    .createHash("sha256")
    .update(`${EMBED_MODEL}|${text}`)
    .digest("hex");

  if (
    doc.embedding?.hash === hash &&
    doc.embedding?.vector?.length
  ) {
    return doc.embedding.vector;
  }

  const vector = await embed(text);

  doc.embedding = {
    vector,
    hash,
    model: EMBED_MODEL
  };

  await doc.save();

  return vector;
}