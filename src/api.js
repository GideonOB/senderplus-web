export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://senderplus-django-api.onrender.com";

export const apiFetch = async (path, options = {}, token = null) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
};
