import React, { useState } from "react";
import { loginRequest, registerRequest } from "../services/authService";

function AuthPage({ onAuthSuccess, theme, toggleTheme }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("zilin@example.com");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.token);
      onAuthSuccess(data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await registerRequest(name, email, password);
      localStorage.setItem("token", data.token);
      onAuthSuccess(data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="theme-toggle-row">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="auth-card">
        <h1>Collaborative Cloud Platform</h1>
        <p className="auth-subtitle">Kanban Board - Step 1</p>

        <div className="auth-switch">
          <button
            className={mode === "login" ? "tab-btn active" : "tab-btn"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "tab-btn active" : "tab-btn"}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="primary-btn" disabled={loading}>
              {loading ? "Processing..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="primary-btn" disabled={loading}>
              {loading ? "Processing..." : "Register"}
            </button>
          </form>
        )}

        {message ? <p className="message">{message}</p> : null}
      </div>
    </div>
  );
}

export default AuthPage;