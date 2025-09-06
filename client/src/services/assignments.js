// client/src/services/assignments.js
import api from "../api";

const API_URL = "/asignaciones";

export const getMyCourses = async () => {
  const { data } = await api.get(`${API_URL}/my-courses`);
  return data;
};

export const listAssignmentsByUser = async (userId) => {
  const { data } = await api.get(API_URL, { params: { userId } });
  return data;
};

export const createAssignment = async (assignmentData) => {
  const { data } = await api.post(API_URL, assignmentData);
  return data;
};

export const deleteAssignment = async (assignmentId) => {
  const { data } = await api.delete(`${API_URL}/${assignmentId}`);
  return data;
};

export const getAssignmentDetail = async (assignmentId) => {
  const { data } = await api.get(`${API_URL}/${assignmentId}`);
  return data;
};