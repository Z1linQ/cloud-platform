import React from "react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function getStartDate(task) {
  if (task.status === "TODO") return "Not started";
  return formatDate(task.updatedAt);
}

function renderAssignees(task) {
  const assignees = task.assignees || [];

  if (assignees.length === 0) {
    return <span className="mini-pill">Unassigned</span>;
  }

  const visible = assignees.slice(0, 2);

  return (
    <div className="assignee-pill-group">
      {visible.map((assignee) => (
        <span key={assignee.id} className="mini-pill">
          {assignee.name}
        </span>
      ))}
      {assignees.length > 2 ? (
        <span className="mini-pill">+{assignees.length - 2}</span>
      ) : null}
    </div>
  );
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
        {renderAssignees(task)}
      </div>

      <div className="task-card-footer">
        <span>Created: {formatDate(task.createdAt)}</span>
        <span>Started: {getStartDate(task)}</span>
      </div>
    </div>
  );
}

export default TaskCard;