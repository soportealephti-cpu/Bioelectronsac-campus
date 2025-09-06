// client/src/services/courses.js
import api from "../api";

const API_URL = "/cursos";

export const listCourses = async () => {
  const { data } = await api.get(API_URL);
  return data;
};

export const createCourse = async (courseData) => {
  const formData = new FormData();
  formData.append("titulo", courseData.titulo);
  formData.append("categoria", courseData.categoria);
  formData.append("pdf", courseData.file);
  
  // Adjuntar imagen si está presente
  if (courseData.imagen) {
    formData.append("imagen", courseData.imagen);
  }

  const { data } = await api.post(API_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const updateCourse = async (id, courseData) => {
  const formData = new FormData();
  formData.append("titulo", courseData.titulo);
  formData.append("categoria", courseData.categoria);
  
  // Adjuntar PDF si está presente
  if (courseData.file) {
    formData.append("pdf", courseData.file);
  }
  
  // Adjuntar imagen si está presente
  if (courseData.imagen) {
    formData.append("imagen", courseData.imagen);
  }

  const { data } = await api.put(`${API_URL}/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const deleteCourse = async (id) => {
  const { data } = await api.delete(`${API_URL}/${id}`);
  return data;
};