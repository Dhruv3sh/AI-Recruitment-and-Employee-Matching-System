import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "text/plain" },
    storedFileName: { type: String, default: "", select: false },
    extractedText: { type: String, default: "", select: false },
    parsingStatus: {
      type: String,
      enum: ["pending", "complete", "failed"],
      default: "pending",
    },
    parsed: {
      skills: { type: [String], default: [] },
      experience: { type: Number, default: 0 },
      education: { type: String, default: "" },
      experienceNeedsReview: { type: Boolean, default: false },
      skillDetails: {
        type: [
          {
            name: { type: String, required: true },
            source: { type: String, enum: ["explicit", "inferred"], required: true },
            confidence: { type: Number, min: 0, max: 1, required: true },
            evidence: { type: String, default: "" },
          },
        ],
        default: [],
      },
    },
    structured: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      title: { type: String, default: "" },
      skills: { type: [String], default: [] },
      experienceYears: { type: Number, default: 0 },
      education: {
        type: [
          {
            degree: { type: String, default: "" },
            institution: { type: String, default: "" },
            year: { type: String, default: "" },
          },
        ],
        default: [],
      },
      projects: {
        type: [
          {
            name: { type: String, default: "" },
            description: { type: String, default: "" },
            technologies: { type: [String], default: [] },
          },
        ],
        default: [],
      },
      certifications: { type: [String], default: [] },
    },
    aiMeta: {
      parser: { type: String, default: "rules-only" },
      model: { type: String, default: "" },
      embeddingModel: { type: String, default: "" },
      fallback: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const Resume = mongoose.model("Resume", resumeSchema);
