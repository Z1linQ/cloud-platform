import React from "react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function getStartDate(task) {
  if (task.status === "TODO") return "Not started";
  return formatDate(task.updatedAt);
}

function TaskCard({ task, onClick, onDragStart }) {
  const commentCount = task?._count?.comments || 0;

  return (
    <div
      className={`task-card glow-${task.status.toLowerCase()}`}
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
    >
      <div className="task-card-top">
        <h4 className="task-card-title">{task.title}</h4>

        <div className="task-card-badges">
          <span className="comment-badge">💬 {commentCount}</span>
        </div>
      </div>

      <div className="task-card-middle">
        <span className="mini-pill">
          {task.assignee?.name || "Unassigned"}
        </span>
      </div>

      <div className="task-card-footer">
        <span>Created: {formatDate(task.createdAt)}</span>
        <span>Started: {getStartDate(task)}</span>
      </div>
    </div>
  );
}

export default TaskCard;