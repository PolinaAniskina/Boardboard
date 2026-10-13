import axios from 'axios';

const TOKEN_KEY = 'kanban_token';
const USER_KEY = 'kanban_user';

export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// --- Токен ---
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// --- Перехватчики ---
client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            // Токен протух или невалиден — чистим и редиректим на логин
            clearAuth();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default client;