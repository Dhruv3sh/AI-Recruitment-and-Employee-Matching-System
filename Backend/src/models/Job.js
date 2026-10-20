import mongoose from "mongoose";

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

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    requirements: {
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
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
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

export const Job = mongoose.model("Job", jobSchema);