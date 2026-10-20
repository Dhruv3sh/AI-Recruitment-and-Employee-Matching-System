import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const requestError = new Error(
      error.response?.data?.message || error.message || "Request failed.",
    );
    requestError.status = error.response?.status;
    return Promise.reject(requestError);
  },
);

export async function apiRequest(path, { token, method = "GET", body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  return api({
    url: path,
    method,
    headers,
    data: body,
  });
}

export async function openResumeFile(resumeId, token) {
  const preview = window.open("", "_blank");
  try {
    const file = await api({
      url: `/resumes/${resumeId}/file`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });
    const url = URL.createObjectURL(file);
    if (preview) {
      preview.location.href = url;
    } else {
      window.open(url, "_blank");
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    preview?.close();
    throw error;
  }
}

export function isUnauthorizedError(error) {
  return error?.status === 401;
}

export const authApi = {
  login: (credentials) =>
    apiRequest("/auth/login", { method: "POST", body: credentials }),
  register: (details) =>
    apiRequest("/auth/register", { method: "POST", body: details }),
  demo: (role) => apiRequest("/auth/demo", { method: "POST", body: { role } }),
};
