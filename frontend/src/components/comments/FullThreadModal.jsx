import React, { useEffect, useRef, useState } from "react";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function FullThreadModal({
  open,
  task,
  comments = [],
  user,
  onClose,
  onAddComment,
  onDeleteComment,
}) {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const commentsEndRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      commentsEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [comments.length, open]);

  if (!open || !task) return null;

  const handleSubmit = async (e) => {
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

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    try {
      await onDeleteComment(commentId);
      setMessage("Comment deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="full-thread-overlay" onClick={onClose}>
      <div className="full-thread-modal" onClick={(e) => e.stopPropagation()}>
        <div className="full-thread-header">
          <div>
            <h2 className="full-thread-title">Discussion · {task.title}</h2>
            <p className="full-thread-subtitle">
              {task.discussionLocked
                ? "Discussion is locked. This thread is read-only."
                : "Full thread view for this task"}
            </p>
          </div>
          <button className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="full-thread-comments">
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
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
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

        {message ? <p className="message">{message}</p> : null}
      </div>
    </div>
  );
}

export default FullThreadModal;