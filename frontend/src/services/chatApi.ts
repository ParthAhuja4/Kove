import axios from "axios";

const chatApi = axios.create({
  baseURL: `${import.meta.env.VITE_CHAT_API_BASE}/api/v1/chat`,
});

chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default chatApi;
