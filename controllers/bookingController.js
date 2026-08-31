// controllers/bookingController.js
const Booking = require("../models/bookingModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// CRUD OPERATIONS
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// CHECK-IN / CHECK-OUT
exports.checkIn = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: "checked-in" },
    { new: true, runValidators: true },
  );

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { booking },
  });
});

exports.checkOut = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: "checked-out" },
    { new: true, runValidators: true },
  );

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { booking },
  });
});
