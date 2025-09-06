const router = require("express").Router();
const multer = require("multer");
const ctrl = require("../controllers/dashboardController");

// Configurar multer para archivos Excel (almacenamiento en memoria)
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos Excel por extensión y MIME type
    const isExcelMime = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                       file.mimetype === 'application/vnd.ms-excel' ||
                       file.mimetype === 'application/octet-stream';
    const isExcelExt = file.originalname.toLowerCase().endsWith('.xlsx') || 
                      file.originalname.toLowerCase().endsWith('.xls');
    
    if (isExcelMime || isExcelExt) {
      cb(null, true);
    } else {
      console.log('Archivo rechazado:', file.originalname, 'MIME:', file.mimetype);
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

router.get("/stats", ctrl.getDashboardStats);
router.get("/export-excel", ctrl.exportToExcel);
router.post("/import-excel", uploadExcel.single("excel"), ctrl.importFromExcel);

module.exports = router;