import React from "react";
import TaskCard from "./TaskCard";

function Column({
  title,
  tasks,
  status,
  onSelectTask,
  onDragStart,
  onDropTask,
  isDraggingOver,
  onDragEnter,
  onDragLeave,
}) {
  return (
    <div
      className={`board-column column-${status.toLowerCase()} ${
        isDraggingOver ? "column-drag-over" : ""
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropTask(status)}
      onDragEnter={() => onDragEnter(status)}
      onDragLeave={() => onDragLeave(status)}
    >
      <div className="column-header">
        <h3>{title}</h3>
        <span className="count-badge">{tasks.length}</span>
      </div>

      <div className="column-body">
        {tasks.length === 0 ? (
          <div className="empty-column">Drop task here</div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onSelectTask}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Column;