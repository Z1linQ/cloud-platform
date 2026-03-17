import React, { useState } from "react";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles/globals.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <DashboardPage token={token} onLogout={handleLogout} />;
}

export default App;