import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
};

export const login = async (username: string, password: string) => {
  const response = await apiClient.post("/login", {
    username: username,
    password: password,
  });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await apiClient.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (data: object) => {
  const response = await apiClient.post("/reset-password", data);
  return response.data;
};

export const changePassword = async (data: object) => {
  const response = await axios.put(
    `${API_URL}/user/password`,
    data,
    getAuthHeaders()
  );
  return response.data;
};
