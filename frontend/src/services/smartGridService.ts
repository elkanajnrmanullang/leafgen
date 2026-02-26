import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const fetchSmartGridRules = async (region?: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/smart-grid-rules`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                region: region
            }
        });
        return response.data;
    } catch (error: any) {
        console.error("Fetch Smart Grid Error:", error);
        
        let fallbackTotal = 0;
        if (error.response && error.response.data && typeof error.response.data.total_transactions !== 'undefined') {
            fallbackTotal = error.response.data.total_transactions;
        }

        return { 
            success: false, 
            is_smart_grid_active: false, 
            total_transactions: fallbackTotal,
            rules: [],
            steps: null 
        };
    }
};