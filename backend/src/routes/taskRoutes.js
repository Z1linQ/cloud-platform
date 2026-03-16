import express from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { creatorId: req.user.id },
              { assigneeId: req.user.id },
            ],
          };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      message: "Tasks fetched successfully",
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, assigneeId, status } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "title is required",
      });
    }

    let finalAssigneeId = null;

    if (req.user.role === "ADMIN") {
      finalAssigneeId = assigneeId || null;
    } else {
      finalAssigneeId = req.user.id;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        creatorId: req.user.id,
        assigneeId: finalAssigneeId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const io = req.app.get("io");
    if (io) {
        io.emit("task:created", task);
    }

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assigneeId } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const canEdit =
      req.user.role === "ADMIN" ||
      existingTask.creatorId === req.user.id ||
      existingTask.assigneeId === req.user.id;

    if (!canEdit) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    if (req.user.role === "ADMIN" && assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const io = req.app.get("io");
    if (io) {
        io.emit("task:updated", updatedTask);
    }

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const canDelete =
      req.user.role === "ADMIN" || existingTask.creatorId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    await prisma.task.delete({
      where: { id },
    });

    const io = req.app.get("io");
    if (io) {
        io.emit("task:deleted", { id });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
});

export default router;