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
      throw new Error(response.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return [];
      }
      throw error;
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
      `${API_URL}/leaflet/templates/${id}`,
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

  generateDraft: async (file: File, templateId: number, storeName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("store_name", storeName);
    formData.append("template_id", templateId.toString());

    try {
      const response = await axios.post(
        `${API_URL}/leaflets/generate-draft`,
        formData,
        getUploadAuthHeader()
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Gagal memproses data");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            "Terjadi kesalahan saat koneksi ke server."
        );
      }
      throw error;
    }
  },

  uploadAndGetRegions: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/leaflet/upload`,
        formData,
        getUploadAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Gagal membaca wilayah dari file."
        );
      }
      throw error;
    }
  },

  saveLeaflet: async (data: {
    id?: string;
    title: string;
    store: string;
    pages: unknown[];
    status: "draft" | "exported";
  }) => {
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
      throw new Error(response.data.message);
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
};
