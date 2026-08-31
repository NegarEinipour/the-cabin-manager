const express = require("express");
const app = express();
const AppError = require("./utils/AppError");
const errorHandler = require("./controllers/errorController");

//IMPORT ROUTERS
const userRouter = require("./routes/userRoutes");
const cabinRouter = require("./routes/cabinRoutes");
const guestRouter = require("./routes/guestRoutes");
const bookingRouter = require("./routes/bookingRoutes");

//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//MOUNT ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cabins", cabinRouter);
app.use("/api/v1/guests", guestRouter);
app.use("/api/v1/bookings", bookingRouter);

// 404 Handler
app.all("/*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
