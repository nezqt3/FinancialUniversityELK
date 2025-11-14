import { API_BASE_URL } from "../../config/api";

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || "Ошибка запроса";
    throw new Error(message);
  }
  return payload;
};

export const fetchProjectsRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/api/projects`);
  return handleResponse(response);
};

export const createProjectRequest = async (project) => {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });
  return handleResponse(response);
};

export const updateProjectRequest = async (project) => {
  if (!project?.id) {
    throw new Error("Project id is required");
  }
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${project.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    },
  );
  return handleResponse(response);
};

export const deleteProjectRequest = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
};
