// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.route("/today-activity").get(bookingController.getTodayActivity);

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
