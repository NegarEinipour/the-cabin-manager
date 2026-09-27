const express = require("express");
const router = express.Router();
const cabinController = require("../controllers/cabinController");
const authController = require("../controllers/authController");

const uploadCabinImage = (req, res, next) => {
  const upload = req.app.locals.uploadCabinImage;
  upload(req, res, next);
};

router.use(authController.protect);

router.get("/", cabinController.getAllCabins);
router.get("/:id", cabinController.getCabin);

router.use(authController.restrictTo("admin", "manager"));

router.post("/", uploadCabinImage, cabinController.createCabin);
router.patch("/:id", uploadCabinImage, cabinController.updateCabin);
router.delete("/:id", cabinController.deleteCabin);

module.exports = router;
