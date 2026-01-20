import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const getJsonAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

const getUploadAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  };
};

export const LeafletService = {
  getTemplates: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/leaflet/templates`,
        getJsonAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  uploadTemplate: async (data: FormData) => {
    const response = await axios.post(
      `${API_URL}/leaflet/templates`,
      data,
      getUploadAuthHeader()
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  updateTemplate: async (id: number, data: FormData) => {
    const response = await axios.post(
      `${API_URL}/leaflet/templates/${id}?_method=PUT`,
      data,
      getUploadAuthHeader()
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  deleteTemplate: async (id: number) => {
    const response = await axios.delete(
      `${API_URL}/leaflet/templates/${id}`,
      getJsonAuthHeader()
    );
    return response.data.success;
  },

  uploadAndGetRegions: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/leaflet/check-regions`,
        formData,
        getUploadAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error: any) {
        if(error.response && error.response.status === 404) {
             return ["ALL", "JAWA", "SUM", "KAL", "SUL", "AMB", "BLI"];
        }
      throw new Error(error.response?.data?.message || "Gagal membaca wilayah.");
    }
  },

  generateDraft: async (file: File, storeName: string, leafletName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("store_name", storeName);
    formData.append("leaflet_name", leafletName);

    const response = await axios.post(
      `${API_URL}/leaflet/generate-draft`,
      formData,
      getUploadAuthHeader()
    );

    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  generateBadge: async (componentName: string, data: any) => {
    const response = await axios.post(
        `${API_URL}/generate-badge`,
        {
            component_name: componentName,
            data: data
        },
        getJsonAuthHeader()
    );

    if (response.data.success) {
        return response.data.data.url;
    }
    throw new Error(response.data.message);
  },

  saveLeaflet: async (data: any) => {
    const response = await axios.post(
      `${API_URL}/leaflets/save`,
      data,
      getJsonAuthHeader()
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  getHistory: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/leaflets`,
        getJsonAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  getLeafletById: async (id: number) => {
    const response = await axios.get(
      `${API_URL}/leaflets/${id}`,
      getJsonAuthHeader()
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  // NEW: Get Dashboard Stats
  getDashboardStats: async () => {
    try {
        const response = await axios.get(
            `${API_URL}/dashboard-stats`,
            getJsonAuthHeader()
        );
        if (response.data.success) {
            return response.data.data;
        }
        return { total_leaflets: 0, recent_activities: [] };
    } catch {
        return { total_leaflets: 0, recent_activities: [] };
    }
  }
};