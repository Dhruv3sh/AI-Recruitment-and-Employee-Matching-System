import crypto from "node:crypto";
import { SEMANTIC_RANGE } from "../config/matching.js";

export const EMBED_MODEL =
  process.env.EMBED_MODEL || "Xenova/all-MiniLM-L6-v2";

let extractorPromise;
const embeddingRequests = new Map();
const embeddingQueues = new Map();

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

  const documentKey = `${doc.constructor.modelName}:${doc._id}`;
  const requestKey = `${documentKey}:${hash}`;
  const existingRequest = embeddingRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const previousRequest = embeddingQueues.get(documentKey) || Promise.resolve();
  const request = previousRequest
    .catch(() => {})
    .then(async () => {
      const vector = await embed(text);
      const embedding = {
        vector,
        hash,
        model: EMBED_MODEL,
      };

      // Match refreshes evaluate one shared Mongoose document in parallel. Persist
      // the embedding atomically instead of calling doc.save() on that instance.
      await doc.constructor.updateOne(
        { _id: doc._id },
        { $set: { embedding } },
      );

      doc.embedding = embedding;
      doc.unmarkModified?.("embedding");
      return vector;
    });

  embeddingRequests.set(requestKey, request);
  embeddingQueues.set(documentKey, request);
  void request.then(() => {
    if (embeddingRequests.get(requestKey) === request) {
      embeddingRequests.delete(requestKey);
    }
    if (embeddingQueues.get(documentKey) === request) {
      embeddingQueues.delete(documentKey);
    }
  }, () => {
    if (embeddingRequests.get(requestKey) === request) {
      embeddingRequests.delete(requestKey);
    }
    if (embeddingQueues.get(documentKey) === request) {
      embeddingQueues.delete(documentKey);
    }
  });

  return request;
}
