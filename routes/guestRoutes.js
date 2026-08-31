const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const authController = require("../controllers/authController");

//PUBLIC ROUTES
router.get("/", guestController.getAllGuests);
router.get("/:id", guestController.getGuest);

//PROTECTED ROUTES
router.use(authController.protect);
router.use(authController.restrictTo("admin", "manager"));

router.post("/", guestController.createGuest);
router.patch("/:id", guestController.updateGuest);
router.delete("/:id", guestController.deleteGuest);

module.exports = router;
