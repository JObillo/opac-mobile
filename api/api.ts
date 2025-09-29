import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.103:8000/api", // your Laravel server IP + port
  timeout: 5000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
