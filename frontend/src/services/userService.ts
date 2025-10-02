import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
};

export const getUsers = async () => {
  const response = await axios.get(`${API_URL}/users`, getAuthHeaders());
  return response.data;
};

export const addUser = async (userData: {
  name: string;
  email: string;
  username: string;
  role: string;
}) => {
  const response = await axios.post(
    `${API_URL}/users`,
    userData,
    getAuthHeaders()
  );
  return response.data;
};

export const deactivateUser = async (userId: number) => {
  const response = await axios.put(
    `${API_URL}/users/${userId}/deactivate`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

export const activateUser = async (userId: number) => {
  const response = await axios.put(
    `${API_URL}/users/${userId}/activate`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

export const resetSimulationData = async () => {
  const response = await axios.post(
    `${API_URL}/debug/reset-data`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await axios.post(`${API_URL}/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (data: object) => {
  const response = await axios.post(`${API_URL}/reset-password`, data);
  return response.data;
};
