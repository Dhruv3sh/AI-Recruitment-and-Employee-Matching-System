import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    breakdown: {
      skills: Number,
      experience: Number,
      education: Number,
      semantic: Number,
    },

    aiMeta: {
      embeddingModel: String,
      generativeModel: String,
      matchingVersion: String,
      semanticAvailable: Boolean,
    },
    scoring: {
      skills: Number,
      experience: Number,
      education: Number,
      semantic: Number,
    },
    matchedSkills: [String],
    missingSkills: [String],
    explanation: String,
    matchingVersion: String,
    rulesScore: Number,
    hybridScore: Number,
    semantic: Number,
  },
  {
    timestamps: true,
  },
);

matchResultSchema.index({ candidate: 1, job: 1 }, { unique: true });

export const MatchResult = mongoose.model("MatchResult", matchResultSchema);
