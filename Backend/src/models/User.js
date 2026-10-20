import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    education: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const embeddingSchema = new mongoose.Schema(
  {
    vector: {
      type: [Number],
      select: false,
    },

    hash: {
      type: String,
      default: "",
    },

    model: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      required: true,
    },

    profile: {
      type: profileSchema,
      default: () => ({}),
    },

    // MiniLM semantic embedding
    embedding: {
      type: embeddingSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);