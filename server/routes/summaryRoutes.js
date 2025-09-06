// server/routes/summaryRoutes.js
const router = require("express").Router();
const ctrl = require("../controllers/summaryController");

router.get("/", ctrl.getSummary);
router.patch("/:assignmentId/status", ctrl.updateAssignmentStatus);

module.exports = router;
