const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { initGridFS } = require("./config/gridfs");
const seedAdminUser = require("./createAdmin.js"); // Importar la función de seeding

// Routers
const examRoutes = require("./routes/examRoutes");
const cursoRoutes = require("./routes/cursoRoutes");
const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuarioRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // 1. Conectar a la base de datos
    await connectDB();

    // 2. Inicializar GridFS para almacenamiento de archivos
    initGridFS();

    // 3. Sembrar el usuario administrador (si no existe)
    await seedAdminUser();

    // 4. Configurar y arrancar Express
    // CORS (permitir todos los orígenes)
    app.use(
      cors({
        origin: "*",
        credentials: false,
      })
    );
    app.use(express.json());

    // Manejar preflight requests
    app.options('*', cors());

    // Servir /uploads (una sola vez)
    app.use(
      "/uploads",
      express.static(path.join(__dirname, "uploads"), {
        setHeaders(res) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
          res.setHeader("Accept-Ranges", "bytes");
        },
      })
    );

    // Rutas API
    app.use("/api/cursos", cursoRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/usuarios", usuarioRoutes);
    app.use("/api/asignaciones", assignmentRoutes);
    app.use("/api/examenes", examRoutes);
    app.use("/api/summary", summaryRoutes);
    app.use("/api/certificates", certificateRoutes);
    app.use("/api/dashboard", dashboardRoutes);

    // Puerto
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));

  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

