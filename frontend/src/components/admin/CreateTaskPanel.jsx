import React, { useState } from "react";

function CreateTaskPanel({ users, onCreateTask }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState("TODO");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await onCreateTask({
        title,
        description,
        assigneeId: assigneeId || null,
        status,
      });

      setTitle("");
      setDescription("");
      setAssigneeId("");
      setStatus("TODO");
      setMessage("Task created successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-panel">
      <h2>Create Task</h2>

      <form className="create-form" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="textarea"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="create-row">
          <select
            className="input"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        <button className="primary-btn" disabled={loading}>
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>

      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

export default CreateTaskPanel;