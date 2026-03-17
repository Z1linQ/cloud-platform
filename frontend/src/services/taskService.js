import API_URL from "./api";

export async function getTasks(token) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch tasks");
  }

  return data;
}

export async function createTask(token, payload) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create task");
  }

  return data;
}

export async function updateTask(token, taskId, payload) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update task");
  }

  return data;
}

export async function deleteTask(token, taskId) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete task");
  }

  return data;
}

export async function updateDiscussionLock(token, taskId, discussionLocked) {
  const res = await fetch(`${API_URL}/api/tasks/${taskId}/discussion-lock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ discussionLocked }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update discussion lock");
  }

  return data;
}