import express from "express";
import cors from "cors";
import prisma from "./utils/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

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

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

export default app;