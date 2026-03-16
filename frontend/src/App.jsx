import React from "react";
import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState("Loading...");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data.message))
      .catch(() => setHealth("Backend unreachable"));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Collaborative Cloud Platform</h1>
      <p>Frontend is running.</p>
      <p>Backend status: {health}</p>
    </div>
  );
}

export default App;