import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const fetchSmartGridRules = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/smart-grid-rules`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(error);
        return { success: false, is_smart_grid_active: false, rules: [] };
    }
};