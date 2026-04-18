const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable.");
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export const apiFetch = async (path, options = {}, token = null) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  return response;
};
