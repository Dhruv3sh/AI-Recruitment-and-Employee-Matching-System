import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import {
  refreshCandidateMatches,
  refreshJobMatches,
} from "../services/matching.js";
import { normalizeSkills } from "../utils/text.js";

function runInBackground(label, task) {
  void task.catch((error) =>
    console.error(`${label} failed:`, error.message),
  );
}

function tokenFor(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.name },
    process.env.JWT_SECRET || "development-only-secret",
    { expiresIn: "7d" },
  );
}

function responseFor(user) {
  return {
    token: tokenFor(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (
      !name ||
      !email ||
      !password ||
      !["candidate", "recruiter"].includes(role)
    )
      return res
        .status(400)
        .json({
          message: "Name, email, password, and a valid role are required.",
        });
    if (await User.exists({ email: email.toLowerCase() }))
      return res
        .status(409)
        .json({ message: "An account already exists for this email." });
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
    res.status(201).json(responseFor(user));
    if (role === "candidate") {
      runInBackground("Initial candidate matching", refreshCandidateMatches(user));
    }
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ message: "Incorrect email or password." });
    res.json(responseFor(user));
  } catch (error) {
    next(error);
  }
}

export async function demoLogin(req, res, next) {
  try {
    const requestedRole =
      req.body?.role === "recruiter" ? "recruiter" : "candidate";
    const passwordHash = await bcrypt.hash("matchwise-demo", 12);
    const demos = [
      {
        name: "Alex Morgan",
        email: "alex@matchwise.demo",
        role: "candidate",
        profile: {
          title: "Frontend Developer",
          location: "Bengaluru",
          experience: 3,
          skills: ["javascript", "react", "typescript", "figma"],
          education: "B.Tech Computer Science",
        },
      },
      {
        name: "Priya Nair",
        email: "priya@matchwise.demo",
        role: "candidate",
        profile: {
          title: "Product Designer",
          location: "Mumbai",
          experience: 4,
          skills: ["figma", "user research", "prototyping", "design systems"],
          education: "B.Des Interaction Design",
        },
      },
      {
        name: "Rahul Mehta",
        email: "rahul@matchwise.demo",
        role: "candidate",
        profile: {
          title: "Data Analyst",
          location: "Pune",
          experience: 2,
          skills: ["python", "sql", "tableau", "excel"],
          education: "B.Sc Statistics",
        },
      },
      {
        name: "Maya Patel",
        email: "maya@matchwise.demo",
        role: "recruiter",
        profile: {},
      },
    ];
    const users = [];
    for (const demo of demos)
      users.push(
        await User.findOneAndUpdate(
          { email: demo.email },
          {
            $setOnInsert: { ...demo, passwordHash },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ),
      );
    const recruiter = users.find((user) => user.role === "recruiter");
    const demoJobs = [
      {
        title: "Product Designer",
        company: "Northstar Labs",
        location: "Remote / Mumbai",
        description:
          "Shape a customer platform from insight to polished interface.",
        requirements: {
          skills: ["figma", "user research", "prototyping", "design systems"],
          experience: 3,
        },
      },
      {
        title: "Frontend Engineer",
        company: "Orbit Commerce",
        location: "Bengaluru",
        description:
          "Build fast, accessible shopping experiences with a product-minded team.",
        requirements: {
          skills: ["javascript", "react", "typescript", "css"],
          experience: 2,
        },
      },
      {
        title: "Data Analyst",
        company: "Signal Works",
        location: "Pune / Hybrid",
        description:
          "Turn customer behavior into practical product and business decisions.",
        requirements: {
          skills: ["python", "sql", "tableau", "analytics"],
          experience: 2,
        },
      },
    ];
    const savedJobs = [];
    for (const job of demoJobs) {
      const savedJob = await Job.findOneAndUpdate(
        { recruiter: recruiter._id, title: job.title, company: job.company },
        { ...job, recruiter: recruiter._id, status: "open" },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      savedJobs.push(savedJob);
    }
    const demoUser = users.find((user) => user.role === requestedRole);
    res.json(responseFor(demoUser));
    runInBackground(
      "Demo matching",
      Promise.all(savedJobs.map((job) => refreshJobMatches(job))),
    );
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, title, location, skills, experience, education } = req.body;
    const user = await User.findById(req.auth.sub).select("+embedding.vector");
    if (!user) return res.status(404).json({ message: "Account not found." });
    user.name = name?.trim() || user.name;
    user.profile = {
      title: title?.trim() || "",
      location: location?.trim() || "",
      skills: normalizeSkills(skills),
      experience: Number(experience || 0),
      education: education?.trim() || "",
    };
    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
    runInBackground("Profile matching", refreshCandidateMatches(user));
  } catch (error) {
    next(error);
  }
}
