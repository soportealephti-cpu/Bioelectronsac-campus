// client/src/services/summary.js
import api from "../api";

const API_URL = "/summary";

export const fetchSummary = async () => {
  const { data } = await api.get(API_URL);
  return data;
};

export const updateAssignmentStatus = async (assignmentId, payload) => {
  const { data } = await api.patch(`${API_URL}/${assignmentId}/status`, payload);
  return data;
};
