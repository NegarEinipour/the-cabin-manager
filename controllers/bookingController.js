// controllers/bookingController.js
const Booking = require("../models/bookingModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// CRUD OPERATIONS

exports.getAllBookings = catchAsync(async (req, res, next) => {
  // 1. FILTER
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  // 2. DATE RANGE FILTERING
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
  // console.log("QUERY:", JSON.stringify(req.query, null, 2));
  // console.log("FILTER:", JSON.stringify(filter, null, 2));
  // 3. PAGINATION PARAMS
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // 4. BASE QUERY — now includes skip/limit
  let query = Booking.find(filter)
    .populate({ path: "guest", select: "fullName email" })
    .populate({ path: "cabin", select: "name" })
    .skip(skip)
    .limit(limit);

  // 5. SORT
  if (req.query.sortBy) {
    const [field, direction] = req.query.sortBy.split("-");
    const sort = direction === "desc" ? `-${field}` : field;
    query = query.sort(sort);
  }

  // 6. EXECUTE — get data and count in parallel
  const [bookings, total] = await Promise.all([
    query,
    Booking.countDocuments(filter),
  ]);

  // 7. RESPOND
  res.status(200).json({
    status: "success",
    results: bookings.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { data: bookings },
  });

  // console.log("RETURNED:", bookings.length, "TOTAL:", total);
});

exports.getBooking = factory.getOne(Booking, [
  { path: "guest", select: "fullName email" },
  { path: "cabin", select: "name" },
]);
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
