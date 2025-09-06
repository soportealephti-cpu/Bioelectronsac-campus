import api from "../api"; // ¡IMPORTANTE! Usar la instancia central de Axios

const API_URL = "/examenes";

// --- CRUD BÁSICO ---

export const listExams = async () => {
  const { data } = await api.get(API_URL);
  return data;
};

export const createExam = async (payload) => {
  const { data } = await api.post(API_URL, payload);
  return data;
};

export const updateExam = async (id, payload) => {
  const { data } = await api.put(`${API_URL}/${id}`, payload);
  return data;
};

export const deleteExam = async (id) => {
  const { data } = await api.delete(`${API_URL}/${id}`);
  return data;
};

export const getExamById = async (examId) => {
  const { data } = await api.get(`${API_URL}/${examId}`);
  return data;
};

// --- LÓGICA ADICIONAL ---

export const assignExamToCourse = async (examId, courseId) => {
  const { data } = await api.put(`${API_URL}/${examId}/asignar-curso`, { courseId });
  return data;
};

export const submitExamResult = async (payload) => {
  const { data } = await api.post(`${API_URL}/submit`, payload);
  return data;
};

