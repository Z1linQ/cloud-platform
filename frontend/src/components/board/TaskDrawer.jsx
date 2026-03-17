import React, { useEffect, useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function TaskDrawer({
  task,
  user,
  users,
  comments = [],
  onClose,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
}) {
  const [status, setStatus] = useState("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!task) return;

    setStatus(task.status || "TODO");
    setAssigneeId(task.assignee?.id || "");
    setMessage("");
    setCommentText("");
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const payload = isAdmin
        ? {
            status,
            assigneeId: assigneeId || null,
          }
        : {
            status,
          };

      await onUpdateTask(task.id, payload);
      setMessage("Task updated successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      await onDeleteTask(task.id);
      onClose();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      await onAddComment(task.id, commentText.trim());
      setCommentText("");
      setMessage("Comment added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="task-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-hero">
            <div className="drawer-status-row">
              <span className={`status-pill status-${task.status.toLowerCase()}`}>
                {task.status}
              </span>
              <span className="soft-pill">
                {task.assignee?.name || "Unassigned"}
              </span>
            </div>

            <h2 className="drawer-title">{task.title}</h2>
            <p className="drawer-subtitle">
              Created {formatDate(task.createdAt)} · Updated {formatDate(task.updatedAt)}
            </p>
          </div>

          <button className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="drawer-section card-section">
          <h4>Description</h4>
          <div className="description-box">
            {task.description || "No description provided."}
          </div>
        </div>

        <div className="drawer-section card-section">
          <h4>Metadata</h4>
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Creator</span>
              <strong>{task.creator?.name || "Unknown"}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Assignee</span>
              <strong>{task.assignee?.name || "Unassigned"}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created At</span>
              <strong>{formatDate(task.createdAt)}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Updated At</span>
              <strong>{formatDate(task.updatedAt)}</strong>
            </div>
          </div>
        </div>

        <div className="drawer-section card-section">
          <h4>Update Task</h4>

          <label className="field-label">Status</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>

          {isAdmin ? (
            <>
              <label className="field-label">Assignee</label>
              <select
                className="input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <button className="primary-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="drawer-section card-section">
          <h4>Comments</h4>

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-comments">No comments yet.</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-head">
                    <strong>{comment.author?.name || "Unknown"}</strong>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))
            )}
          </div>

          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              className="textarea"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="primary-btn" disabled={loading}>
              {loading ? "Posting..." : "Add Comment"}
            </button>
          </form>
        </div>

        {isAdmin ? (
          <div className="drawer-section danger-zone">
            <h4>Danger Zone</h4>
            <button className="danger-btn" onClick={handleDelete} disabled={loading}>
              Delete Task
            </button>
          </div>
        ) : null}

        {message ? <p className="message">{message}</p> : null}
      </div>
    </div>
  );
}

export default TaskDrawer;