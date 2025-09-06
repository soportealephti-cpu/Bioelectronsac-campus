import api from "../api";

export const exportDatabaseToExcel = async () => {
  try {
    const response = await api.get("/dashboard/export-excel", {
      responseType: 'blob' // Importante para manejar archivos binarios
    });
    
    return response.data;
  } catch (error) {
    console.error("Error exporting database to Excel:", error);
    throw error;
  }
};

export const importDatabaseFromExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append("excel", file);
    
    const response = await api.post("/dashboard/import-excel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error importing database from Excel:", error);
    throw error;
  }
};