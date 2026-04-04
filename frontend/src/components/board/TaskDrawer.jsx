import React, { useEffect, useRef, useState } from "react";
import FullThreadModal from "../comments/FullThreadModal";
import MultiAssignSelector from "../common/MultiAssignSelector";

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
  onDeleteComment,
  onToggleDiscussionLock,
}) {
  const [status, setStatus] = useState("TODO");
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [showFullThread, setShowFullThread] = useState(false);
  const commentsEndRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!task) return;

    setDeleteLoading(false);
    setMessage("");
    setCommentText("");
    setActiveTab("details");
    setShowFullThread(false);
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;

    setStatus(task.status || "TODO");
    setAssigneeIds((task.assignees || []).map((user) => user.id));
  }, [task?.id, task?.status, task?.assignees]);

  useEffect(() => {
    if (activeTab !== "discussion") return;

    requestAnimationFrame(() => {
      commentsEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [comments.length, activeTab]);

  if (!task) return null;

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const payload = isAdmin
        ? {
            status,
            assigneeIds,
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

    setDeleteLoading(true);
    setMessage("");

    try {
      await onDeleteTask(task.id);
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeleteLoading(false);
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
      setActiveTab("discussion");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    try {
      await onDeleteComment(commentId);
      setMessage("Comment deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleToggleLock = async () => {
    try {
      await onToggleDiscussionLock(task.id, !task.discussionLocked);
    } catch (error) {
      setMessage(error.message);
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
                {task.assignees?.length
                  ? task.assignees.map((user) => user.name).join(", ")
                  : "Unassigned"}
              </span>
              <span className="soft-pill">💬 {comments.length}</span>
              <span
                className={
                  task.discussionLocked ? "lock-pill locked" : "lock-pill open"
                }
              >
                {task.discussionLocked ? "Discussion Locked" : "Discussion Open"}
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

        <div className="drawer-tabs">
          <button
            className={activeTab === "details" ? "drawer-tab active" : "drawer-tab"}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={activeTab === "discussion" ? "drawer-tab active" : "drawer-tab"}
            onClick={() => setActiveTab("discussion")}
          >
            Discussion ({comments.length})
          </button>
        </div>

        {activeTab === "details" ? (
          <>
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
                  <strong>
                    {task.assignees?.length
                      ? task.assignees.map((user) => user.name).join(", ")
                      : "Unassigned"}
                  </strong>
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
                  <label className="field-label">Assigned Members</label>
                  <MultiAssignSelector
                    users={users}
                    selectedIds={assigneeIds}
                    onChange={setAssigneeIds}
                  />
                </>
              ) : null}

              <button className="primary-btn" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {isAdmin ? (
              <div className="drawer-section danger-zone">
                <h4>Danger Zone</h4>
                <button
                  className="ghost-btn"
                  onClick={handleToggleLock}
                  style={{ marginRight: "10px" }}
                >
                  {task.discussionLocked ? "Unlock Discussion" : "Lock Discussion"}
                </button>

                <button
                  className="danger-btn"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="drawer-section card-section">
            <div className="discussion-header">
              <div className="discussion-header-left">
                <h4>Comments</h4>
                <span
                  className={
                    task.discussionLocked ? "lock-pill locked" : "lock-pill open"
                  }
                >
                  {task.discussionLocked ? "Read Only" : "Open"}
                </span>
              </div>

              <div className="discussion-header-actions">
                {isAdmin ? (
                  <button className="ghost-btn" onClick={handleToggleLock}>
                    {task.discussionLocked
                      ? "Unlock Discussion"
                      : "Lock Discussion"}
                  </button>
                ) : null}

                <button
                  className="ghost-btn"
                  onClick={() => setShowFullThread(true)}
                >
                  Open Full Thread
                </button>
              </div>
            </div>

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

                    {isAdmin ? (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                className="textarea"
                placeholder={
                  task.discussionLocked
                    ? "Discussion is locked"
                    : "Write a comment..."
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={task.discussionLocked}
              />
              <button
                className="primary-btn"
                disabled={loading || task.discussionLocked}
              >
                {loading ? "Posting..." : "Add Comment"}
              </button>
            </form>
          </div>
        )}

        {message ? <p className="message">{message}</p> : null}

        <FullThreadModal
          open={showFullThread}
          task={task}
          comments={comments}
          user={user}
          onClose={() => setShowFullThread(false)}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      </div>
    </div>
  );
}

export default TaskDrawer;