import React from "react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function getStartDate(task) {
  if (task.status === "TODO") return "Not started";
  return formatDate(task.updatedAt);
}

function TaskCard({ task, onClick, onDragStart }) {
  return (
    <div
      className={`task-card glow-${task.status.toLowerCase()}`}
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
    >
      <div className="task-card-header">
        <h4>{task.title}</h4>
      </div>

      <div className="task-meta">
        <span>Created: {formatDate(task.createdAt)}</span>
      </div>

      <div className="task-meta">
        <span>Started: {getStartDate(task)}</span>
      </div>
    </div>
  );
}

export default TaskCard;