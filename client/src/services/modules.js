// client/src/services/modules.js
import api from "../api";

/**
 * Obtener lista de módulos únicos desde los cursos existentes
 */
export const listModules = async () => {
  const { data } = await api.get("/cursos/modulos");
  return data;
};

/**
 * Asignar todos los cursos de un módulo a un usuario
 */
export const assignModuleToUser = async (userId, moduleName, days = 30) => {
  const { data } = await api.post("/asignaciones/module", { userId, moduleName, days });
  return data;
};
