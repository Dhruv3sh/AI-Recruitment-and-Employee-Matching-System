import { randomUUID } from "node:crypto";
import { copyFile, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import mammoth from "mammoth";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Application } from "../models/Application.js";
import { Resume } from "../models/Resume.js";
import { User } from "../models/User.js";
import { refreshCandidateMatches } from "../services/matching.js";
import { parseResume } from "../services/resumeParser.js";

export const resumeRoutes = Router();

const allowedExtensions = new Set([".pdf", ".docx", ".txt", ".md"]);
const uploadsDirectory = path.resolve(process.cwd(), "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.has(extension)) return callback(null, true);
    const error = new Error("Only PDF, DOCX, TXT, and Markdown resume files are allowed.");
    error.status = 400;
    return callback(error);
  },
});

async function extractText(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  if (extension === ".docx") {
    return (await mammoth.extractRawText({ buffer: file.buffer })).value;
  }
  return file.buffer.toString("utf8");
}

function compactParsedResume(parsed) {
  const education = parsed.forStorage.education;
  return {
    skills: parsed.forStorage.skills,
    experience: parsed.forStorage.experience,
    education: Array.isArray(education)
      ? education
          .map(({ degree, institution, year }) =>
            [degree, institution, year].filter(Boolean).join(" - "),
          )
          .filter(Boolean)
          .join("; ")
      : String(education || "").trim(),
    experienceNeedsReview: Boolean(parsed.forStorage.experienceNeedsReview),
    skillDetails: parsed.forStorage.skillDetails || [],
  };
}

function publicResume(resume) {
  return {
    id: resume._id,
    candidate: resume.candidate,
    fileName: resume.fileName,
    mimeType: resume.mimeType,
    parsed: resume.parsed,
    structured: resume.structured,
    aiMeta: resume.aiMeta,
    parsingStatus: resume.parsingStatus,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

function safeDownloadName(fileName) {
  return String(fileName).replace(/[\r\n"]/g, "_");
}

async function preserveApplicationSnapshots(resume) {
  const applications = await Application.find({ resume: resume._id })
    .select("+resumeSnapshot.storedFileName");
  const pendingSnapshots = applications.filter(
    (application) => !application.resumeSnapshot?.storedFileName,
  );
  if (!pendingSnapshots.length || !resume.storedFileName) return;

  await Promise.all(pendingSnapshots.map(async (application) => {
    const extension = path.extname(resume.storedFileName) || path.extname(resume.fileName);
    const storedFileName = `application-${randomUUID()}${extension}`;
    await copyFile(
      path.join(uploadsDirectory, resume.storedFileName),
      path.join(uploadsDirectory, storedFileName),
    );
    application.resumeSnapshot = {
      fileName: application.resumeSnapshot?.fileName || resume.fileName,
      mimeType: resume.mimeType,
      storedFileName,
      parsingStatus: application.resumeSnapshot?.parsingStatus || resume.parsingStatus,
      parsed: application.resumeSnapshot?.parsed || resume.parsed,
    };
    await application.save();
  }));
}

async function removePreviousCandidateResumes(candidateId) {
  const previousResumes = await Resume.find({ candidate: candidateId })
    .select("+storedFileName");

  for (const resume of previousResumes) {
    await preserveApplicationSnapshots(resume);
  }

  for (const resume of previousResumes) {
    if (resume.storedFileName) {
      await unlink(path.join(uploadsDirectory, resume.storedFileName)).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    await resume.deleteOne();
  }

  return previousResumes.length;
}

async function processResume({ resumeId, candidateId, extractedText }) {
  try {
    const parsed = await parseResume(extractedText);
    const compactParsed = compactParsedResume(parsed);
    const [resume, candidate] = await Promise.all([
      Resume.findByIdAndUpdate(
        resumeId,
        {
          parsed: compactParsed,
          structured: parsed.structured,
          aiMeta: parsed.meta,
          parsingStatus: "complete",
        },
        { new: true },
      ),
      User.findById(candidateId).select("+embedding.vector"),
    ]);
    if (!resume || !candidate) return;

    candidate.profile.skills = [
      ...new Set([...candidate.profile.skills, ...compactParsed.skills]),
    ];
    if (compactParsed.experience > 0) {
      candidate.profile.experience = compactParsed.experience;
    }
    if (parsed.structured.title?.trim()) {
      candidate.profile.title = parsed.structured.title.trim();
    }
    if (compactParsed.education) {
      candidate.profile.education = compactParsed.education;
    }
    await candidate.save();
    await refreshCandidateMatches(candidate);
  } catch (error) {
    await Resume.findByIdAndUpdate(resumeId, { parsingStatus: "failed" }).catch(() => {});
    console.error("Resume processing failed:", error.message);
  }
}

resumeRoutes.post(
  "/",
  requireAuth,
  requireRole("candidate"),
  upload.single("resume"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Attach a resume file." });
      }

      const extension = path.extname(req.file.originalname).toLowerCase();
      const storedFileName = `${randomUUID()}${extension}`;
      const extractedText = await extractText(req.file);
      await mkdir(uploadsDirectory, { recursive: true });
      await writeFile(path.join(uploadsDirectory, storedFileName), req.file.buffer);

      let replacedResumeCount = 0;
      try {
        replacedResumeCount = await removePreviousCandidateResumes(req.auth.sub);
      } catch (error) {
        await unlink(path.join(uploadsDirectory, storedFileName)).catch(() => {});
        throw error;
      }

      const resume = await Resume.create({
        candidate: req.auth.sub,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        storedFileName,
        extractedText,
        parsingStatus: "pending",
      });

      res.status(202).json({
        resume: publicResume(resume),
        message: replacedResumeCount
          ? "Resume updated. Parsing and matching continue in the background."
          : "Resume uploaded. Parsing and matching continue in the background.",
      });

      void processResume({
        resumeId: resume._id,
        candidateId: req.auth.sub,
        extractedText,
      });
    } catch (error) {
      next(error);
    }
  },
);

resumeRoutes.get(
  "/",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({ candidate: req.auth.sub })
        .sort({ createdAt: -1 });
      res.json({ resumes: resume ? [publicResume(resume)] : [] });
    } catch (error) {
      next(error);
    }
  },
);

resumeRoutes.delete(
  "/:resumeId",
  requireAuth,
  requireRole("candidate"),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({
        _id: req.params.resumeId,
        candidate: req.auth.sub,
      }).select("+storedFileName");
      if (!resume) return res.status(404).json({ message: "Resume not found." });

      if (resume.storedFileName) {
        await preserveApplicationSnapshots(resume);
        await unlink(path.join(uploadsDirectory, resume.storedFileName)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
      await resume.deleteOne();
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

resumeRoutes.get(
  "/:resumeId/file",
  requireAuth,
  async (req, res, next) => {
    try {
      const resume = await Resume.findById(req.params.resumeId).select("+storedFileName");
      if (!resume?.storedFileName) {
        return res.status(404).json({ message: "Resume file not found." });
      }

      const isOwner = String(resume.candidate) === req.auth.sub;
      const isApplicantRecruiter = req.auth.role === "recruiter" && await Application.exists({
        candidate: resume.candidate,
        recruiter: req.auth.sub,
        resume: resume._id,
      });
      if (!isOwner && !isApplicantRecruiter) {
        return res.status(403).json({ message: "You cannot view this resume." });
      }

      res.type(resume.mimeType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${safeDownloadName(resume.fileName)}"`,
      );
      res.sendFile(path.join(uploadsDirectory, resume.storedFileName), (error) => {
        if (error) next(error);
      });
    } catch (error) {
      next(error);
    }
  },
);
