// API Client for MeshSOS Backend
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('mesh_auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// SOS API endpoints
export const sosAPI = {
    // Get all SOS packets (including responded)
    getAll: async (hours = 168, limit = 5000) => {
        const response = await apiClient.get('/api/v1/all-sos', {
            params: {
                hours: hours,
                limit: limit
            }
        });
        return response.data.sos_packets || [];
    },

    // Get active SOS cases only
    getActive: async () => {
        const response = await apiClient.get('/api/v1/active-sos', {
            params: { hours: 24, limit: 100 }
        });
        return response.data.sos_packets || [];
    },

    // Get SOS created by user
    getMySos: async () => {
        const response = await apiClient.get('/api/v1/my-sos', {
            params: { hours: 720, limit: 100 }
        });
        return response.data.sos_packets || [];
    },

    // Create new SOS
    create: async (sosData) => {
        // Transform frontend data to backend format
        const backendData = {
            sos_id: crypto.randomUUID(),
            device_id: 'web-dashboard',
            timestamp: new Date().toISOString(),
            latitude: sosData.latitude,
            longitude: sosData.longitude,
            accuracy: sosData.accuracy || 0,
            emergency_type: sosData.emergency_type,
            optional_message: sosData.optional_message || null,
            battery_percentage: sosData.battery_percentage,
            hop_count: 0,
            ttl: 10,
            signature: null
        };

        const response = await apiClient.post('/api/v1/upload-sos', backendData);
        return response.data;
    },

    // Get SOS by ID
    getById: async (id) => {
        const response = await apiClient.get(`/api/v1/sos/${id}`);
        return response.data;
    },

    // Update SOS status (mark as responded)
    updateStatus: async (sosId, status) => {
        const response = await apiClient.post('/api/v1/mark-responded', {
            sos_id: sosId,
            responder_id: 'web-dashboard'
        });
        return response.data;
    },

    // Get network stats (calculated from all SOS)
    getStats: async () => {
        try {
            const response = await apiClient.get('/api/v1/all-sos', {
                params: { hours: 168, limit: 1000 }
            });
            const allPackets = response.data.sos_packets || [];
            const activePackets = allPackets.filter(p => p.status !== 'RESPONDED');

            return {
                totalSOS: allPackets.length,
                activeSOS: activePackets.length,
                totalNodes: new Set(allPackets.map(p => p.device_id)).size,
                responseRate: allPackets.length > 0
                    ? Math.round(((allPackets.length - activePackets.length) / allPackets.length) * 100)
                    : 0,
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                totalSOS: 0,
                activeSOS: 0,
                totalNodes: 0,
                responseRate: 0,
            };
        }
    },
};

export default apiClient;
