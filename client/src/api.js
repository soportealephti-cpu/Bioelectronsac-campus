import axios from "axios";

// Determinar la URL base del API según el entorno
const getApiBaseUrl = () => {
  // Si existe variable de entorno, usarla
  if (process.env.REACT_APP_API_URL) {
    return `${process.env.REACT_APP_API_URL}/api`;
  }

  // Si estamos en desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  // En producción, usar la URL HTTPS
  return 'https://api.campus.bioelectronsac.com/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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

