import React, { useState } from "react";
import Column from "./Column";

function Board({ tasks, onSelectTask, onMoveTask }) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState("");

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDropTask = (newStatus) => {
    if (!draggedTask) return;

    setDragOverStatus("");

    if (draggedTask.status !== newStatus) {
      onMoveTask(draggedTask, newStatus);
    }

    setDraggedTask(null);
  };

  const handleDragEnter = (status) => {
    setDragOverStatus(status);
  };

  const handleDragLeave = (status) => {
    if (dragOverStatus === status) {
      setDragOverStatus("");
    }
  };

  return (
    <div className="board-wrapper">
      <Column
        title="To Do"
        status="TODO"
        tasks={todoTasks}
        onSelectTask={onSelectTask}
        onDragStart={handleDragStart}
        onDropTask={handleDropTask}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        isDraggingOver={dragOverStatus === "TODO"}
      />

      <Column
        title="In Progress"
        status="IN_PROGRESS"
        tasks={inProgressTasks}
        onSelectTask={onSelectTask}
        onDragStart={handleDragStart}
        onDropTask={handleDropTask}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        isDraggingOver={dragOverStatus === "IN_PROGRESS"}
      />

      <Column
        title="Done"
        status="DONE"
        tasks={doneTasks}
        onSelectTask={onSelectTask}
        onDragStart={handleDragStart}
        onDropTask={handleDropTask}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        isDraggingOver={dragOverStatus === "DONE"}
      />
    </div>
  );
}

export default Board;