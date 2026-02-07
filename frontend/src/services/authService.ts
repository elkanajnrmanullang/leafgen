import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

export const getCsrfToken = async () => {
  return await apiClient.get("/sanctum/csrf-cookie");
};

export const login = async (username: string, password: string) => {
  const response = await apiClient.post("/api/login", {
    username,
    password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post("/api/logout");
  return response.data;
};

export const getUser = async () => {
  const response = await apiClient.get("/api/user");
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await apiClient.post("/api/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (data: object) => {
  const response = await apiClient.post("/api/reset-password", data);
  return response.data;
};

export const changePassword = async (data: object) => {
  const response = await apiClient.put("/api/user/password", data);
  return response.data;
};

export default apiClient;