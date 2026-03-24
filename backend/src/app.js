import express from "express";
import cors from "cors";
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  register,
} from "prom-client";
import prisma from "./utils/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();

collectDefaultMetrics({ register });

const httpRequestDuration =
  register.getSingleMetric("http_request_duration_seconds") ||
  new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  });

const httpRequestCount =
  register.getSingleMetric("http_requests_total") ||
  new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestCount.inc(labels);
    end(labels);
  });

  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend is running",
    status: "ok",
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      message: "Database connection successful",
      status: "ok",
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      status: "error",
      error: error.message,
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

export default app;