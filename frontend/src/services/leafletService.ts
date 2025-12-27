import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
};

const getJsonAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export const LeafletService = {
  generateDraft: async (file: File, templateId: number, storeName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("store_name", storeName);
    formData.append("template_id", templateId.toString());

    try {
      const response = await axios.post(
        `${API_URL}/leaflets/generate-draft`,
        formData,
        getAuthHeader()
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
        getAuthHeader()
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
    try {
      const response = await axios.post(
        `${API_URL}/leaflets/save`,
        data,
        getJsonAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error: unknown) {
      console.error("Save failed", error);
      throw error;
    }
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Fetch history error", error.response?.data);
      }
      return [];
    }
  },

  getLeafletById: async (id: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/leaflets/${id}`,
        getJsonAuthHeader()
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error: unknown) {
      console.error("Fetch detail error", error);
      throw error;
    }
  },
};
