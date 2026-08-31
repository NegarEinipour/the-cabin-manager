// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

// Check-in / Check-out
router.patch("/:id/checkin", bookingController.checkIn);
router.patch("/:id/checkout", bookingController.checkOut);

module.exports = router;
