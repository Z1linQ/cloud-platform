import express from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const taskInclude = {
  creator: {
    select: { id: true, name: true, email: true, role: true },
  },
  assignments: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: {
      assignedAt: "asc",
    },
  },
  _count: {
    select: {
      comments: true,
    },
  },
};

function mapTask(task) {
  return {
    ...task,
    assignees: task.assignments.map((assignment) => assignment.user),
  };
}

router.get("/", async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { creatorId: req.user.id },
              {
                assignments: {
                  some: {
                    userId: req.user.id,
                  },
                },
              },
            ],
          };

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      message: "Tasks fetched successfully",
      tasks: tasks.map(mapTask),
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
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can create tasks",
      });
    }

    const { title, description, assigneeIds = [], status } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "title is required",
      });
    }

    const uniqueAssigneeIds = [...new Set((assigneeIds || []).filter(Boolean))];

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        creatorId: req.user.id,
        assignments: {
          create: uniqueAssigneeIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: taskInclude,
    });

    const mappedTask = mapTask(task);

    const io = req.app.get("io");
    if (io) {
      io.emit("task:created", mappedTask);
    }

    res.status(201).json({
      message: "Task created successfully",
      task: mappedTask,
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
    const { title, description, status, assigneeIds } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const isRelatedUser =
      existingTask.creatorId === req.user.id ||
      existingTask.assignments.some((assignment) => assignment.userId === req.user.id);

    const canEdit = req.user.role === "ADMIN" || isRelatedUser;

    if (!canEdit) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const updateData = {};

    if (req.user.role === "ADMIN") {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;

      if (assigneeIds !== undefined) {
        const uniqueAssigneeIds = [...new Set((assigneeIds || []).filter(Boolean))];

        updateData.assignments = {
          deleteMany: {},
          create: uniqueAssigneeIds.map((userId) => ({
            userId,
          })),
        };
      }
    } else {
      if (status !== undefined) updateData.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: taskInclude,
    });

    const mappedTask = mapTask(updatedTask);

    const io = req.app.get("io");
    if (io) {
      io.emit("task:updated", mappedTask);
    }

    res.json({
      message: "Task updated successfully",
      task: mappedTask,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
});

router.put("/:id/discussion-lock", async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can lock or unlock discussions",
      });
    }

    const { id } = req.params;
    const { discussionLocked } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        discussionLocked: Boolean(discussionLocked),
      },
      include: taskInclude,
    });

    const mappedTask = mapTask(updatedTask);

    const io = req.app.get("io");
    if (io) {
      io.emit("task:updated", mappedTask);
    }

    res.json({
      message: "Discussion lock updated successfully",
      task: mappedTask,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update discussion lock",
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

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admins can delete tasks",
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