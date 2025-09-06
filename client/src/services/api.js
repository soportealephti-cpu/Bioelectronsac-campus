// client/src/services/api.js
import axios from "axios";

// Ajusta el baseURL si usas otro puerto/host
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default api;
