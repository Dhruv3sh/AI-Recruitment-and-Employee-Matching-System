import mongoose from "mongoose";

const profileSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    skills: { type: [String], default: [] },
    experience: { type: Number, min: 0, default: 0 },
    education: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const resumeSnapshotSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    storedFileName: { type: String, default: "", select: false },
    parsingStatus: { type: String, default: "pending" },
    parsed: {
      skills: { type: [String], default: [] },
      experience: { type: Number, min: 0, default: 0 },
      education: { type: String, default: "" },
    },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },
    resumeSnapshot: { type: resumeSnapshotSchema, default: null },
    profileSnapshot: { type: profileSnapshotSchema, required: true },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true },
);

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
