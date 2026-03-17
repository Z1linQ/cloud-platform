import API_URL from "./api";

export async function getUsers(token) {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }

  return data;
}