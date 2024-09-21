import axios from 'axios';
import { ENDPOINTS } from './endpoints';

const api = axios.create({
    baseURL: ENDPOINTS.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(ENDPOINTS.TOKEN_REFRESH, { refresh: refreshToken });
                    localStorage.setItem('accessToken', response.data.access);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return axios(originalRequest);
                } else {
                    handleLogout();
                }
            } catch (refreshError) {
                console.error('Refresh token error:', refreshError);
                handleLogout();
            }
        } else if (!localStorage.getItem('accessToken')) {
            handleLogout();
        } else {
            return Promise.reject(error);
        }
    }
);



// const handleLogout = () => {
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('refreshToken');
//     localStorage.removeItem('userId');
//     window.location.href = '/login';
// };

export const login = async (credentials) => {
    try {
        const response = await api.post(ENDPOINTS.LOGIN, credentials);
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};