import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Job } from "../models/Job.js";
import { refreshJobMatches } from "../services/matching.js";
import { normalizeSkills } from "../utils/text.js";

export const jobRoutes = Router();
jobRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = { status: "open" };
    if (req.auth.role === "recruiter") filter.recruiter = req.auth.sub;
    res.json({
      jobs: await Job.find(filter).sort({ createdAt: -1 }),
    });
  } catch (error) {
    next(error);
  }
});
jobRoutes.get("/:jobId", requireAuth, async (req, res, next) => {
  try {
    const filter = { _id: req.params.jobId, status: "open" };
    if (req.auth.role === "recruiter") filter.recruiter = req.auth.sub;
    const job = await Job.findOne(filter);
    if (!job) return res.status(404).json({ message: "Open job not found." });
    res.json({ job });
  } catch (error) {
    next(error);
  }
});
jobRoutes.post(
  "/",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const {
        title,
        company,
        location,
        description,
        skills,
        experience,
        education,
      } = req.body;
      if (!title || !company || !normalizeSkills(skills).length)
        return res
          .status(400)
          .json({
            message:
              "Title, company, and at least one required skill are needed.",
          });
      const job = await Job.create({
        recruiter: req.auth.sub,
        title,
        company,
        location,
        description,
        requirements: {
          skills: normalizeSkills(skills),
          experience: Number(experience || 0),
          education: education || "",
        },
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
