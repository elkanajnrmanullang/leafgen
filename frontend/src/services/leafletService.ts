import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadLeafletData = async (formData: FormData) => {
  const response = await apiClient.post("/leaflet/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const generateLeafletLayout = async (
  uploadId: string,
  templateId: number
) => {
  const response = await apiClient.post("/leaflet/generate-layout", {
    upload_id: uploadId,
    template_id: templateId,
  });
  return response.data;
};
