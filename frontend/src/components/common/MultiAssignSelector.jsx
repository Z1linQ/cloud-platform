import React from "react";

function MultiAssignSelector({ users, selectedIds = [], onChange }) {
  const toggleUser = (userId) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <div className="multi-assign-selector">
      <div className="multi-assign-grid">
        {users.map((user) => {
          const selected = selectedIds.includes(user.id);

          return (
            <button
              key={user.id}
              type="button"
              className={
                selected
                  ? "assign-user-card selected"
                  : "assign-user-card"
              }
              onClick={() => toggleUser(user.id)}
            >
              <div className="assign-user-top">
                <strong>{user.name}</strong>
                <span className={selected ? "assign-check active" : "assign-check"}>
                  {selected ? "✓" : ""}
                </span>
              </div>

              <div className="assign-user-meta">
                <span>{user.email}</span>
                <span>{user.role}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="multi-select-actions">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => onChange([])}
        >
          Clear Selection
        </button>
        <span className="helper-text">
          Click to select or deselect members. No selection = Unassigned
        </span>
      </div>
    </div>
  );
}

export default MultiAssignSelector;