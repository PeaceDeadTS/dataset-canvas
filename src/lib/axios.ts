import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const axiosInstance = axios.create({
  baseURL: '/api', // Базовый URL для всех запросов
  timeout: 10000, // 10 секунд таймаут
});

// Interceptor для автоматического добавления JWT токена
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов и обновления токена
axiosInstance.interceptors.response.use(
  (response) => {
    // Если сервер возвращает обновленный токен, сохраняем его
    const newToken = response.headers.token;
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    return response;
  },
  (error) => {
    // Если получили 401, пользователь не авторизован
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Перенаправляем на страницу авторизации только если мы не на ней уже
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
