import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [mode, setMode] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("zilin@example.com");
  const [password, setPassword] = useState("123456");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : {
        "Content-Type": "application/json",
      };

  const handleApiError = async (res) => {
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    throw new Error(data.message || "Request failed");
  };

  const fetchMe = async (currentToken = token) => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch current user");
    }

    const data = await res.json();
    setUser(data.user);
  };

  const fetchTasks = async (currentToken = token) => {
    const res = await fetch(`${API_URL}/api/tasks`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    setTasks(data.tasks || []);
  };

  const loadDashboard = async (currentToken = token) => {
    await fetchMe(currentToken);
    await fetchTasks(currentToken);
  };

  useEffect(() => {
    if (!token) return;

    loadDashboard(token).catch((err) => {
      console.error(err);
      setMessage("Session expired. Please log in again.");
      handleLogout();
    });
  }, [token]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        await handleApiError(res);
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setMessage("Registered successfully.");
      setName("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        await handleApiError(res);
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setMessage("Login successful.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setTasks([]);
    setMessage("Logged out.");
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!res.ok) {
        await handleApiError(res);
      }

      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");
      setMessage("Task created successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        await handleApiError(res);
      }

      const data = await res.json();

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data.task : task))
      );

      setMessage("Task updated successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await handleApiError(res);
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setMessage("Task deleted successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Collaborative Cloud Platform</h1>
          <p style={styles.subtitle}>Frontend + Backend + PostgreSQL connected</p>

          <div style={styles.switchRow}>
            <button
              style={mode === "login" ? styles.activeButton : styles.button}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              style={mode === "register" ? styles.activeButton : styles.button}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {mode === "register" ? (
            <form onSubmit={handleRegister} style={styles.form}>
              <input
                style={styles.input}
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button style={styles.primaryButton} disabled={loading}>
                {loading ? "Processing..." : "Register"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={styles.form}>
              <input
                style={styles.input}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button style={styles.primaryButton} disabled={loading}>
                {loading ? "Processing..." : "Login"}
              </button>
            </form>
          )}

          {message ? <p style={styles.message}>{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.dashboard}>
        <div style={styles.topBar}>
          <div>
            <h1 style={{ margin: 0 }}>Task Dashboard</h1>
            <p style={{ marginTop: "8px", color: "#555" }}>
              Logged in as <strong>{user?.name}</strong> ({user?.email}) | Role:{" "}
              <strong>{user?.role}</strong>
            </p>
          </div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={styles.card}>
          <h2>Create Task</h2>
          <form onSubmit={handleCreateTask} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              style={styles.textarea}
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button style={styles.primaryButton} disabled={loading}>
              {loading ? "Processing..." : "Create Task"}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h2>Tasks</h2>
          {tasks.length === 0 ? (
            <p>No tasks yet.</p>
          ) : (
            <div style={styles.taskList}>
              {tasks.map((task) => (
                <div key={task.id} style={styles.taskItem}>
                  <div>
                    <h3 style={{ margin: "0 0 8px 0" }}>{task.title}</h3>
                    <p style={{ margin: "0 0 8px 0", color: "#555" }}>
                      {task.description || "No description"}
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#777" }}>
                      Status: <strong>{task.status}</strong>
                    </p>
                  </div>

                  <div style={styles.taskActions}>
                    <button
                      style={styles.smallButton}
                      onClick={() => handleStatusChange(task.id, "TODO")}
                    >
                      TODO
                    </button>
                    <button
                      style={styles.smallButton}
                      onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                    >
                      IN PROGRESS
                    </button>
                    <button
                      style={styles.smallButton}
                      onClick={() => handleStatusChange(task.id, "DONE")}
                    >
                      DONE
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {message ? <p style={styles.message}>{message}</p> : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },
  dashboard: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  title: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "42px",
  },
  subtitle: {
    color: "#666",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  textarea: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    minHeight: "100px",
    resize: "vertical",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
  },
  activeButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#d9534f",
    color: "#fff",
    cursor: "pointer",
    height: "fit-content",
  },
  deleteButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#d9534f",
    color: "#fff",
    cursor: "pointer",
  },
  smallButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
  },
  switchRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  taskItem: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  taskActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "flex-end",
  },
  message: {
    marginTop: "12px",
    color: "#333",
    fontWeight: "bold",
  },
};

export default App;