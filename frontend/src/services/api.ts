// frontend/src/services/api.ts
import axios from 'axios';

// Podstawowy URL twojego backendu
// W trybie deweloperskim backend działa na porcie 3001
// W trybie produkcyjnym to będzie adres twojego wdrożonego backendu
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do dodawania tokenu JWT do każdego żądania, jeśli jest dostępny
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Przechowujemy token w localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;