import { Router } from "express";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import { Resume } from "../models/Resume.js";
import { User } from "../models/User.js";
import { MatchResult } from "../models/MatchResult.js";
import { cleanEducationLabel } from "../services/resumeRules.js";
import {
  sendApplicationAcceptedEmail,
  sendApplicationRejectedEmail,
} from "../services/emailService.js";
import { applicationReadiness } from "../services/applicationReadiness.js";

export const applicationRoutes = Router();
const uploadsDirectory = path.resolve(process.cwd(), "uploads");

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

function resumeSnapshot(resume, storedFileName = "") {
  if (!resume) return null;
  return {
    fileName: resume.fileName,
    mimeType: resume.mimeType,
    storedFileName,
    parsingStatus: resume.parsingStatus,
    parsed: {
      skills: resume.parsed?.skills || [],
      experience: resume.parsed?.experience || 0,
      education: resume.parsed?.education || "",
    },
  };
}

function publicApplication(application) {
  const result = application.toObject ? application.toObject() : { ...application };
  const hasResumeSnapshot = Boolean(result.resumeSnapshot?.storedFileName);
  if (result.profileSnapshot?.education) {
    result.profileSnapshot.education = cleanEducationLabel(result.profileSnapshot.education);
  }
  if (result.resumeSnapshot?.parsed?.education) {
    result.resumeSnapshot.parsed.education = cleanEducationLabel(
      result.resumeSnapshot.parsed.education,
    );
  }
  if (result.resumeSnapshot?.storedFileName) {
    delete result.resumeSnapshot.storedFileName;
  }
  return { ...result, hasResumeSnapshot };
}

function safeDownloadName(fileName) {
  return String(fileName).replace(/[\r\n"]/g, "_");
}

function matchKey(candidate, job) {
  return `${String(candidate)}:${String(job)}`;
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
          .sort({ createdAt: -1 })
          .select("+storedFileName"),
      ]);
      if (!candidate) return res.status(404).json({ message: "Candidate profile not found." });
      if (!job) return res.status(404).json({ message: "Open job not found." });

      const readiness = applicationReadiness(candidate, resume);
      if (!readiness.ready) return res.status(400).json({ message: readiness.message });
      if (await Application.exists({ candidate: candidate._id, job: job._id })) {
        return res.status(409).json({ message: "You have already applied for this job." });
      }

      const extension = path.extname(resume.storedFileName) || path.extname(resume.fileName);
      const applicationStoredFileName = `application-${randomUUID()}${extension}`;
      await mkdir(uploadsDirectory, { recursive: true });
      try {
        await copyFile(
          path.join(uploadsDirectory, resume.storedFileName),
          path.join(uploadsDirectory, applicationStoredFileName),
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          return res.status(409).json({ message: "Your latest resume file is unavailable. Upload it again before applying." });
        }
        throw error;
      }
      const application = await Application.create({
        candidate: candidate._id,
        recruiter: job.recruiter,
        job: job._id,
        resume: resume?._id || null,
        resumeSnapshot: resumeSnapshot(resume, applicationStoredFileName),
        profileSnapshot: candidateSnapshot(candidate),
      });
      res.status(201).json({
        application: publicApplication(application),
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
  "/:applicationId/resume",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const application = await Application.findOne({
        _id: req.params.applicationId,
        recruiter: req.auth.sub,
      }).select("+resumeSnapshot.storedFileName");
      const snapshot = application?.resumeSnapshot;
      if (!snapshot?.storedFileName) {
        return res.status(404).json({ message: "Application resume snapshot not found." });
      }

      res.type(snapshot.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${safeDownloadName(snapshot.fileName)}"`);
      res.sendFile(path.join(uploadsDirectory, snapshot.storedFileName), (error) => {
        if (error) next(error);
      });
    } catch (error) {
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
  "/received",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const applications = await Application.find({ recruiter: req.auth.sub })
        .select("+resumeSnapshot.storedFileName")
        .populate("job", "title company location")
        .lean();
      const candidateIds = applications.map((application) => application.candidate);
      const jobIds = applications.map((application) => application.job?._id || application.job);
      const matches = await MatchResult.find({
        candidate: { $in: candidateIds },
        job: { $in: jobIds },
      }).lean();
      const matchesByApplication = new Map(
        matches.map((match) => [
          matchKey(match.candidate, match.job),
          { score: match.score, explanation: match.explanation || "", matchedSkills: match.matchedSkills || [] },
        ]),
      );

      const ranked = applications
        .map((application) => ({
          ...publicApplication(application),
          match: matchesByApplication.get(
            matchKey(application.candidate, application.job?._id || application.job),
          ) || {
            score: 0,
            explanation: "Matching is still being prepared for this application.",
            matchedSkills: [],
          },
        }))
        .sort((left, right) => right.match.score - left.match.score || new Date(right.createdAt) - new Date(left.createdAt));
      res.json({ applications: ranked });
    } catch (error) {
      next(error);
    }
  },
);

applicationRoutes.patch(
  "/:applicationId/decision",
  requireAuth,
  requireRole("recruiter"),
  async (req, res, next) => {
    try {
      const decision = req.body?.decision;
      if (!["accepted", "rejected"].includes(decision)) {
        return res.status(400).json({ message: "Choose accepted or rejected." });
      }

      const application = await Application.findOne({
        _id: req.params.applicationId,
        recruiter: req.auth.sub,
      }).populate("job", "title company location");
      if (!application) return res.status(404).json({ message: "Application not found." });
      if (application.status !== "submitted") {
        return res.status(409).json({ message: "This application has already been decided." });
      }
      if (!application.job) {
        return res.status(409).json({ message: "The related job is no longer available." });
      }

      if (decision === "accepted") {
        await sendApplicationAcceptedEmail({
          candidateName: application.profileSnapshot.name,
          candidateEmail: application.profileSnapshot.email,
          job: application.job,
        });
      } else {
        await sendApplicationRejectedEmail({
          candidateName: application.profileSnapshot.name,
          candidateEmail: application.profileSnapshot.email,
          job: application.job,
        });
      }

      application.status = decision;
      await application.save();
      res.json({
        application: publicApplication(application),
        message: decision === "accepted"
          ? "Application accepted and next-steps email sent."
          : "Application rejected and update email sent.",
      });
    } catch (error) {
      next(error);
    }
  },
);

applicationRoutes.delete(
  "/jobs/:jobId",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const application = await Application.findOneAndDelete({
        candidate: req.auth.sub,
        job: req.params.jobId,
      }).select("+resumeSnapshot.storedFileName");
      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }
      if (application.resumeSnapshot?.storedFileName) {
        await unlink(path.join(uploadsDirectory, application.resumeSnapshot.storedFileName)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      res.json({ message: "Application withdrawn." });
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
