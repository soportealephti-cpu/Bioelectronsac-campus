import api from "../api";

export const getDashboardStats = async () => {
  try {
    const { data } = await api.get("/dashboard/stats");
    return data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};