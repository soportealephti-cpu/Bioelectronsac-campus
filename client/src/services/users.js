import api from "../api";

const API_URL = "/usuarios";

export const listUsers = async () => {
  const { data } = await api.get(API_URL);
  return data;
};

export const createUser = async (userData) => {
  const { data } = await api.post(API_URL, userData);
  return data;
};

export const updateUser = async (id, userData) => {
  const { data } = await api.put(`${API_URL}/${id}`, userData);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`${API_URL}/${id}`);
  return data;
};

