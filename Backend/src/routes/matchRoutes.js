import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { MatchResult } from "../models/MatchResult.js";
import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { createJobCoach } from "../services/jobCoach.js";

export const matchRoutes = Router();
matchRoutes.get(
  "/recommendations",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const matches = await MatchResult.find({ candidate: req.auth.sub })
        .populate("job")
        .sort({ score: -1 });
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  },
);
matchRoutes.get(
  "/jobs/:jobId",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const job = await Job.exists({
        _id: req.params.jobId,
        recruiter: req.auth.sub,
      });
      if (!job) return res.status(404).json({ message: "Job not found." });
      const matches = await MatchResult.find({ job: req.params.jobId })
        .populate("candidate", "name email profile")
        .sort({ score: -1 });
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  },
);
matchRoutes.get(
  "/jobs/:jobId/coach",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const [job, candidate, match] = await Promise.all([
        Job.findOne({ _id: req.params.jobId, status: "open" }),
        User.findById(req.auth.sub).select("profile"),
        MatchResult.findOne({ candidate: req.auth.sub, job: req.params.jobId }),
      ]);
      if (!job) return res.status(404).json({ message: "Open job not found." });
      if (!candidate) return res.status(404).json({ message: "Candidate profile not found." });

      const missingSkills = match?.missingSkills || job.requirements?.skills || [];
      const coach = await createJobCoach({ job, candidate, missingSkills });
      res.json({ coach, score: match?.score ?? null, matchedSkills: match?.matchedSkills || [] });
    } catch (error) {
      next(error);
    }
  },
);
