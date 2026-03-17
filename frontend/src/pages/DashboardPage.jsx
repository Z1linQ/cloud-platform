import React, { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import API_URL from "../services/api";
import { getMe } from "../services/authService";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateDiscussionLock,
} from "../services/taskService";
import { getUsers } from "../services/userService";
import {
  getComments,
  createComment,
  deleteComment,
} from "../services/commentService";
import Board from "../components/board/Board";
import CreateTaskPanel from "../components/admin/CreateTaskPanel";
import TaskDrawer from "../components/board/TaskDrawer";

function DashboardPage({ token, onLogout, theme, toggleTheme }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskComments, setSelectedTaskComments] = useState([]);
  const [message, setMessage] = useState("Loading dashboard...");

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      unassigned: tasks.filter((t) => !t.assignee).length,
    };
  }, [tasks]);

  const loadData = useCallback(async () => {
    try {
      const [meData, taskData, userData] = await Promise.all([
        getMe(token),
        getTasks(token),
        getUsers(token),
      ]);

      setUser(meData.user);
      setTasks(taskData.tasks || []);
      setUsers(userData.users || []);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to load dashboard");
    }
  }, [token]);

  const loadComments = useCallback(
    async (taskId) => {
      if (!taskId) {
        setSelectedTaskComments([]);
        return;
      }

      try {
        const data = await getComments(token, taskId);
        setSelectedTaskComments(data.comments || []);
      } catch (error) {
        console.error(error);
        setSelectedTaskComments([]);
        setMessage(error.message || "Failed to load comments");
      }
    },
    [token]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedTask?.id) {
      setSelectedTaskComments([]);
      return;
    }

    loadComments(selectedTask.id);
  }, [selectedTask?.id, loadComments]);

  useEffect(() => {
    if (!selectedTask?.id) return;

    const updatedTask = tasks.find((task) => task.id === selectedTask.id);

    if (!updatedTask) {
      setSelectedTask(null);
      setSelectedTaskComments([]);
      return;
    }

    if (updatedTask !== selectedTask) {
      setSelectedTask(updatedTask);
    }
  }, [tasks, selectedTask]);

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("task:created", async () => {
      await loadData();
    });

    socket.on("task:updated", async () => {
      await loadData();
    });

    socket.on("task:deleted", async () => {
      await loadData();
    });

    socket.on("comment:created", async ({ taskId, comment }) => {
      await loadData();

      if (selectedTask?.id === taskId) {
        setSelectedTaskComments((prev) => {
          const exists = prev.some((item) => item.id === comment.id);
          if (exists) return prev;
          return [...prev, comment];
        });
      }
    });

    socket.on("comment:deleted", async ({ taskId, commentId }) => {
      await loadData();

      if (selectedTask?.id === taskId) {
        setSelectedTaskComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [token, loadData, selectedTask?.id]);

  const handleCreateTask = async (payload) => {
    const data = await createTask(token, payload);
    setTasks((prev) => [data.task, ...prev]);
    setMessage("Task created successfully.");
  };

  const handleUpdateTask = async (taskId, payload) => {
    const data = await updateTask(token, taskId, payload);

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? data.task : task))
    );

    setSelectedTask(data.task);
    setMessage("Task updated successfully.");
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(token, taskId);

    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setSelectedTask(null);
    setSelectedTaskComments([]);
    setMessage("Task deleted successfully.");
  };

  const handleMoveTask = async (task, newStatus) => {
    const previousTasks = tasks;

    const optimisticTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? optimisticTask : t))
    );

    if (selectedTask?.id === task.id) {
      setSelectedTask(optimisticTask);
    }

    try {
      const data = await updateTask(token, task.id, { status: newStatus });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? data.task : t))
      );

      if (selectedTask?.id === task.id) {
        setSelectedTask(data.task);
      }

      setMessage("Task moved successfully.");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to move task");

      setTasks(previousTasks);

      if (selectedTask?.id === task.id) {
        const originalTask = previousTasks.find((t) => t.id === task.id);
        setSelectedTask(originalTask || null);
      }
    }
  };

  const handleAddComment = async (taskId, content) => {
    const data = await createComment(token, taskId, content);

    setSelectedTaskComments((prev) => [...prev, data.comment]);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              updatedAt: data.comment.createdAt,
              _count: {
                ...(task._count || {}),
                comments: (task._count?.comments || 0) + 1,
              },
            }
          : task
      )
    );

    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? {
            ...prev,
            updatedAt: data.comment.createdAt,
            _count: {
              ...(prev._count || {}),
              comments: (prev._count?.comments || 0) + 1,
            },
          }
        : prev
    );

    setMessage("Comment added.");
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedTask?.id) return;

    const taskId = selectedTask.id;

    await deleteComment(token, commentId);

    setSelectedTaskComments((prev) =>
      prev.filter((comment) => comment.id !== commentId)
    );

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              _count: {
                ...(task._count || {}),
                comments: Math.max((task._count?.comments || 1) - 1, 0),
              },
            }
          : task
      )
    );

    setSelectedTask((prev) =>
      prev && prev.id === taskId
        ? {
            ...prev,
            _count: {
              ...(prev._count || {}),
              comments: Math.max((prev._count?.comments || 1) - 1, 0),
            },
          }
        : prev
    );

    setMessage("Comment deleted.");
  };

  const handleToggleDiscussionLock = async (taskId, discussionLocked) => {
    const data = await updateDiscussionLock(token, taskId, discussionLocked);

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? data.task : task))
    );

    setSelectedTask((prev) =>
      prev && prev.id === taskId ? data.task : prev
    );

    setMessage(
      discussionLocked
        ? "Discussion locked successfully."
        : "Discussion unlocked successfully."
    );
  };

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div>
          <h1 className="page-title">Kanban Dashboard</h1>
          <p className="page-subtitle">
            {user
              ? `Logged in as ${user.name} (${user.role})`
              : "Loading user..."}
          </p>
        </div>

        <div className="topbar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button className="danger-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {user?.role === "ADMIN" ? (
        <>
          <section className="summary-grid">
            <div className="summary-card">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="summary-card">
              <span>Todo</span>
              <strong>{summary.todo}</strong>
            </div>
            <div className="summary-card">
              <span>In Progress</span>
              <strong>{summary.inProgress}</strong>
            </div>
            <div className="summary-card">
              <span>Done</span>
              <strong>{summary.done}</strong>
            </div>
            <div className="summary-card">
              <span>Unassigned</span>
              <strong>{summary.unassigned}</strong>
            </div>
          </section>

          <CreateTaskPanel users={users} onCreateTask={handleCreateTask} />
        </>
      ) : null}

      {message ? <p className="message">{message}</p> : null}

      <Board
        tasks={tasks}
        onSelectTask={setSelectedTask}
        onMoveTask={handleMoveTask}
      />

      <TaskDrawer
        task={selectedTask}
        user={user}
        users={users}
        comments={selectedTaskComments}
        onClose={() => {
          setSelectedTask(null);
          setSelectedTaskComments([]);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onToggleDiscussionLock={handleToggleDiscussionLock}
      />
    </div>
  );
}

export default DashboardPage;