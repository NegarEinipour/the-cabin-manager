const Booking = require("../models/bookingModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  ["startDate", "createdAt"].forEach((field) => {
    if (req.query[field]?.gte) {
      filter[field] = { $gte: new Date(req.query[field].gte) };
    }
    if (req.query[field]?.lte) {
      filter[field] = {
        ...filter[field],
        $lte: new Date(req.query[field].lte),
      };
    }
  });

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  let query = Booking.find(filter)
    .populate({ path: "guest", select: "fullName email" })
    .populate({ path: "cabin", select: "name" })
    .skip(skip)
    .limit(limit);

  if (req.query.sortBy) {
    const [field, direction] = req.query.sortBy.split("-");
    const sort = direction === "desc" ? `-${field}` : field;
    query = query.sort(sort);
  }

  const [bookings, total] = await Promise.all([
    query,
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: bookings.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { data: bookings },
  });
});

exports.getBooking = factory.getOne(Booking, [
  { path: "guest", select: "fullName email" },
  { path: "cabin", select: "name" },
]);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({
      path: "guest",
      select: "fullName email nationality countryFlag",
    })
    .populate({ path: "cabin", select: "name" });

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  const io = req.app.get("io");
  io.emit("booking:updated", booking);

  res.status(200).json({
    status: "success",
    data: { data: booking },
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  const io = req.app.get("io");
  io.emit("booking:deleted", req.params.id);

  res.status(204).send();
});

exports.getTodayActivity = catchAsync(async (req, res, next) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    status: { $in: ["unconfirmed", "checked-in"] },
    startDate: { $lte: todayEnd },
    endDate: { $gte: todayStart },
  })
    .populate({ path: "guest", select: "fullName nationality countryFlag" })
    .sort("startDate");

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: { data: bookings },
  });
});
