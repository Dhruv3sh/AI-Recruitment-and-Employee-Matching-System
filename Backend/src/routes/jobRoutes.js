import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Job } from "../models/Job.js";
import { createJobDescriptionDraft } from "../services/jobDescriptionGenerator.js";
import { refreshJobMatches } from "../services/matching.js";
import { normalizeSkills } from "../utils/text.js";

export const jobRoutes = Router();

function jobPayload(body = {}) {
  return {
    title: String(body.title || "").trim(),
    company: String(body.company || "").trim(),
    location: String(body.location || "").trim(),
    description: String(body.description || "").trim(),
    requirements: {
      skills: normalizeSkills(body.skills),
      experience: Math.max(0, Number(body.experience || 0)),
      education: String(body.education || "").trim(),
    },
  };
}

function validateJobPayload(job) {
  if (job.title && job.company && job.requirements.skills.length) return null;
  return "Title, company, and at least one required skill are needed.";
}

jobRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = req.auth.role === "recruiter"
      ? { recruiter: req.auth.sub }
      : { status: "open" };
    res.json({
      jobs: await Job.find(filter).sort({ createdAt: -1 }),
    });
  } catch (error) {
    next(error);
  }
});
jobRoutes.get("/:jobId", requireAuth, async (req, res, next) => {
  try {
    const filter = { _id: req.params.jobId };
    if (req.auth.role === "recruiter") filter.recruiter = req.auth.sub;
    else filter.status = "open";
    const job = await Job.findOne(filter);
    if (!job) return res.status(404).json({ message: "Job not found." });
    res.json({ job });
  } catch (error) {
    next(error);
  }
});

jobRoutes.post(
  "/generate-description",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const details = jobPayload(req.body);
      if (!details.title) {
        return res.status(400).json({ message: "Enter a job title before generating a description." });
      }
      const draft = await createJobDescriptionDraft({
        ...details,
        skills: details.requirements.skills,
        experience: details.requirements.experience,
        education: details.requirements.education,
      });
      res.json({
        ...draft,
        message: "Description draft generated. Review and edit it before publishing.",
      });
    } catch (error) {
      next(error);
    }
  },
);

jobRoutes.post(
  "/",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const details = jobPayload(req.body);
      const validationMessage = validateJobPayload(details);
      if (validationMessage) return res.status(400).json({ message: validationMessage });
      const job = await Job.create({
        recruiter: req.auth.sub,
        ...details,
      });
      res
        .status(201)
        .json({
          job,
          message: "Job parsed, published, and matched to candidates.",
        });
      void refreshJobMatches(job).catch((error) =>
        console.error("Job matching failed:", error.message),
      );
    } catch (error) {
      next(error);
    }
  },
);

jobRoutes.patch(
  "/:jobId",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const details = jobPayload(req.body);
      const validationMessage = validateJobPayload(details);
      if (validationMessage) return res.status(400).json({ message: validationMessage });

      const job = await Job.findOneAndUpdate(
        { _id: req.params.jobId, recruiter: req.auth.sub },
        details,
        { new: true, runValidators: true },
      );
      if (!job) return res.status(404).json({ message: "Published role not found." });

      if (job.status === "open") {
        void refreshJobMatches(job).catch((error) =>
          console.error("Job matching refresh failed:", error.message),
        );
      }
      res.json({ job, message: "Published role updated. Matching will refresh shortly." });
    } catch (error) {
      next(error);
    }
  },
);

jobRoutes.patch(
  "/:jobId/close",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const job = await Job.findOneAndUpdate(
        { _id: req.params.jobId, recruiter: req.auth.sub, status: "open" },
        { status: "closed" },
        { new: true },
      );
      if (!job) return res.status(404).json({ message: "Open role not found." });
      res.json({ job, message: "Role closed. It is no longer visible to candidates." });
    } catch (error) {
      next(error);
    }
  },
);
