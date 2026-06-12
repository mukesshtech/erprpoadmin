import axios from 'axios';

const api = axios.create({
  baseURL: '/api/erp',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  transformRequest: [(data) => {
    if (data && typeof data === 'object') {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(data)) {
        params.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
      }
      return params.toString();
    }
    return data;
  }],
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
