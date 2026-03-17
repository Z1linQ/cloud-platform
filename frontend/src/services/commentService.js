import API_URL from "./api";

export async function getComments(token, taskId) {
  const res = await fetch(`${API_URL}/api/comments/task/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch comments");
  }

  return data;
}

export async function createComment(token, taskId, content) {
  const res = await fetch(`${API_URL}/api/comments/task/${taskId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create comment");
  }

  return data;
}