import api from "../api"; // ¡IMPORTANTE! Usar la instancia central de Axios

const API_URL = "/certificates";

// --- PLANTILLA ---

export const getCertificateTemplate = async () => {
  const { data } = await api.get(`${API_URL}/template`);
  return data;
};

export const updateCertificateTemplate = async ({ gerenteNombre, backgroundFile, firmaFile }) => {
  const fd = new FormData();
  if (gerenteNombre !== undefined) fd.append("gerenteNombre", gerenteNombre);
  if (backgroundFile) fd.append("background", backgroundFile);
  if (firmaFile) fd.append("firma", firmaFile);

  // El interceptor de `api` añadirá el token. Axios se encarga del Content-Type.
  const { data } = await api.put(`${API_URL}/template`, fd);
  return data;
};

export const getNextCertificateNumber = async (year) => {
  const { data } = await api.get(`${API_URL}/next-number`, { params: { year } });
  return data?.number;
};

// --- CRUD CERTIFICADO ---

export const emitCertificate = async ({ userId, courseId, number, emitDate }) => {
  const { data } = await api.post(API_URL, { userId, courseId, number, emitDate });
  return data;
};

export const getCertificateById = async (id) => {
  const { data } = await api.get(`${API_URL}/${id}`);
  return data;
};

export const openCertificatePdf = (id) => {
  // La URL base ya está en la instancia de `api`, así que la tomamos de ahí.
  const pdfUrl = `${api.defaults.baseURL}${API_URL}/${id}/pdf`;
  window.open(pdfUrl, "_blank");
};

// --- LÓGICA DE ASIGNACIÓN ---

export const ensureCertificateForAssignment = async (payload) => {
  const { data } = await api.post(`${API_URL}/ensure`, payload);
  return data;
};

