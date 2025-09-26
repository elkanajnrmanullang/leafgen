import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/users";

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
  const response = await axios.get(API_URL, getAuthHeaders());
  return response.data;
};

export const addUser = async (userData: {
  name: string;
  email: string;
  username: string;
  role: string;
}) => {
  const response = await axios.post(API_URL, userData, getAuthHeaders());
  return response.data;
};

export const deactivateUser = async (userId: number) => {
  const response = await axios.put(
    `${API_URL}/${userId}/deactivate`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

export const activateUser = async (userId: number) => {
  const response = await axios.put(
    `${API_URL}/${userId}/activate`,
    {},
    getAuthHeaders()
  );
  return response.data;
};
