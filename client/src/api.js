import axios from "axios";

const api = axios.create({
  baseURL: "https://api.campus.bioelectronsac.com/api",
});

// Interceptor para agregar el token a las cabeceras
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

