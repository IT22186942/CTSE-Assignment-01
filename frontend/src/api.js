import axios from "axios";

const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:3001"
});

const contractApi = axios.create({
  baseURL: import.meta.env.VITE_CONTRACT_SERVICE_URL || "http://localhost:3002"
});

const paymentApi = axios.create({
  baseURL: import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:3003"
});

const notificationApi = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://localhost:3004"
});

function attachToken(config) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

contractApi.interceptors.request.use(attachToken);
paymentApi.interceptors.request.use(attachToken);
notificationApi.interceptors.request.use(attachToken);
userApi.interceptors.request.use(attachToken);

export { userApi, contractApi, paymentApi, notificationApi };
