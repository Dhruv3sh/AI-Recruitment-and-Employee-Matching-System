import "dotenv/config";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { connectDatabase } from "./db/database.js";
import { warmUp } from "./services/EmbeddingService.js";
import { authRoutes } from "./routes/authRoutes.js";
import { applicationRoutes } from "./routes/applicationRoutes.js";
import { jobRoutes } from "./routes/jobRoutes.js";
import { matchRoutes } from "./routes/matchRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { resumeRoutes } from "./routes/resumeRoutes.js";

const app = express();
const allowedOrigins = [
  process.env.WEB_ORIGIN || "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.includes(origin)),
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "matchwise-api" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/matches", matchRoutes);
app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ message: error.message || "Something went wrong." });
});

const port = Number(process.env.API_PORT || 4002);

async function startServer() {
  try {
    await connectDatabase();

    // Warm up MiniLM without blocking startup
    warmUp()
      .then(() =>
        console.log(
          "Embedding model ready"
        )
      )
      .catch((error) =>
        console.warn(
          "Embedding model unavailable:",
          error.message
        )
      );

    app.listen(
      port,
      () => {
        console.log(
          `Server running on port ${port}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error
    );

    process.exit(1);
  }
}

startServer();
