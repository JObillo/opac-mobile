import axios from "axios";

const api = axios.create({
  // your Laravel server IP + port
  baseURL: "http://192.168.0.103:8000/api",
  // baseURL: "http://10.0.0.134:8000/api",
  //  baseURL: "http://192.168.99.16:8000/api",  
  timeout: 5000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;


