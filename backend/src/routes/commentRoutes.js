import express from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
      },
    });

    if (!fullTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (fullTask.discussionLocked) {
      return res.status(403).json({
        message: "Discussion is locked",
      });
    }

    const isRelated =
      req.user.role === "ADMIN" ||
      fullTask.creatorId === req.user.id ||
      fullTask.assignments.some((assignment) => assignment.userId === req.user.id);

    if (!isRelated) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json({
      message: "Comments fetched successfully",
      comments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
});

router.post("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
      },
    });

    if (!fullTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (fullTask.discussionLocked) {
      return res.status(403).json({
        message: "Discussion is locked",
      });
    }

    const isRelated =
      req.user.role === "ADMIN" ||
      fullTask.creatorId === req.user.id ||
      fullTask.assignments.some((assignment) => assignment.userId === req.user.id);

    if (!isRelated) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("comment:created", { taskId, comment });
    }

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create comment",
      error: error.message,
    });
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can delete comments",
      });
    }

    const { commentId } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("comment:deleted", {
        taskId: existingComment.taskId,
        commentId,
      });
    }

    res.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
});

export default router;