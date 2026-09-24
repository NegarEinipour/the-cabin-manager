// routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authController = require("../controllers/authController");
// ─── ROUTES ───
router.get("/", settingsController.getSettings);
router.patch(
  "/",
  //   authController.protect,
  authController.restrictTo("admin"),
  settingsController.updateSettings,
);

module.exports = router;
