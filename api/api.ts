import axios from "axios";

const api = axios.create({
  // your Laravel server IP + port
  // baseURL: "http://192.168.12.16:8000/api",
  baseURL: "http://192.168.0.104:8000/api",
  //  baseURL: "http://192.168.137.43:8000/api",  
  timeout: 5000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;


