// routes/cabinRoutes.js
const express = require("express");
const router = express.Router();
const cabinController = require("../controllers/cabinController");
const authController = require("../controllers/authController");

// Public routes (view cabins)
router.get("/", cabinController.getAllCabins);
router.get("/:id", cabinController.getCabin);

// Protected routes (manage cabins)
router.use(authController.protect);

router.use(authController.restrictTo("admin", "manager"));

router.post("/", cabinController.createCabin);
router.patch("/:id", cabinController.updateCabin);
router.delete("/:id", cabinController.deleteCabin);

module.exports = router;
