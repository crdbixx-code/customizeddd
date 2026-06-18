import axios from 'axios';

// Backend base URL — same-origin by default (set VITE_API_URL to override, e.g. http://localhost:3000)
const baseURL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true, // send session cookie alongside JWT
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && err?.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('pb_token');
      localStorage.removeItem('pb_user');
    }
    return Promise.reject(err);
  }
);

export default client;
