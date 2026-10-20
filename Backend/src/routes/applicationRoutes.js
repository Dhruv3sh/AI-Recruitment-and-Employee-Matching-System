import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { User } from "../models/User.js";
import { cleanEducationLabel } from "../services/resumeRules.js";

export const applicationRoutes = Router();

function candidateSnapshot(candidate) {
  return {
    name: candidate.name,
    email: candidate.email,
    title: candidate.profile?.title || "",
    location: candidate.profile?.location || "",
    skills: candidate.profile?.skills || [],
    experience: candidate.profile?.experience || 0,
    education: candidate.profile?.education || "",
  };
}

function resumeSnapshot(resume) {
  if (!resume) return null;
  return {
    fileName: resume.fileName,
    parsingStatus: resume.parsingStatus,
    parsed: {
      skills: resume.parsed?.skills || [],
      experience: resume.parsed?.experience || 0,
      education: resume.parsed?.education || "",
    },
  };
}

function publicApplication(application) {
  const result = application.toObject();
  if (result.profileSnapshot?.education) {
    result.profileSnapshot.education = cleanEducationLabel(result.profileSnapshot.education);
  }
  if (result.resumeSnapshot?.parsed?.education) {
    result.resumeSnapshot.parsed.education = cleanEducationLabel(
      result.resumeSnapshot.parsed.education,
    );
  }
  return result;
}

applicationRoutes.post(
  "/",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const { jobId } = req.body || {};
      const [candidate, job, resume] = await Promise.all([
        User.findById(req.auth.sub),
        Job.findOne({ _id: jobId, status: "open" }),
        Resume.findOne({ candidate: req.auth.sub })
          .sort({ createdAt: -1 }),
      ]);
      if (!candidate) return res.status(404).json({ message: "Candidate profile not found." });
      if (!job) return res.status(404).json({ message: "Open job not found." });

      const application = await Application.create({
        candidate: candidate._id,
        recruiter: job.recruiter,
        job: job._id,
        resume: resume?._id || null,
        resumeSnapshot: resumeSnapshot(resume),
        profileSnapshot: candidateSnapshot(candidate),
      });
      res.status(201).json({
        application,
        message: "Application sent to the recruiter.",
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ message: "You have already applied for this job." });
      }
      next(error);
    }
  },
);

applicationRoutes.get(
  "/",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const applications = await Application.find({ candidate: req.auth.sub })
        .select("job status createdAt updatedAt")
        .sort({ createdAt: -1 });
      res.json({ applications });
    } catch (error) {
      next(error);
    }
  },
);

applicationRoutes.get(
  "/jobs/:jobId",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const job = await Job.exists({ _id: req.params.jobId, recruiter: req.auth.sub });
      if (!job) return res.status(404).json({ message: "Job not found." });

      const applications = await Application.find({ job: req.params.jobId })
        .sort({ createdAt: -1 });
      res.json({ applications: applications.map(publicApplication) });
    } catch (error) {
      next(error);
    }
  },
);
