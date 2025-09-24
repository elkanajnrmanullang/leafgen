import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/products';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    };
};

export const getProducts = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

export const addProduct = async (productData: FormData) => {
    const config = {
        ...getAuthHeaders(),
        headers: {
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await axios.post(API_URL, productData, config);
    return response.data;
};

export const deleteProduct = async (productId: number) => {
    const response = await axios.delete(`${API_URL}/${productId}`, getAuthHeaders());
    return response.data;
};