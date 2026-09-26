const express = require("express");
const app = express();
const cors = require("cors");
const AppError = require("./utils/AppError");
const errorHandler = require("./controllers/errorController");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

//IMPORT ROUTERS
const userRouter = require("./routes/userRoutes");
const cabinRouter = require("./routes/cabinRoutes");
const guestRouter = require("./routes/guestRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const settingsRouter = require("./routes/settingsRoutes");

// Load environment variables
dotenv.config({ path: "./.env" });

// ─── MULTER CONFIGURATION ───
// Store file in memory (buffer)
const storage = multer.memoryStorage();

// File filter: only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Single image upload middleware (for cabins)
const uploadCabinImage = upload.single("image");

// ADD THIS LINE - Make upload middleware available to routes
app.locals.uploadCabinImage = uploadCabinImage;
// ─── END MULTER ───

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://your-production-domain.com"
      : "http://localhost:5173", // Vite frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

//MIDDLEWARE
app.use(cors(corsOptions)); //Enable CORS for all origins
app.set("query parser", "extended");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//MOUNT ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cabins", cabinRouter);
// app.use("/api/v1/cabins", cabinRouter(uploadCabinImage));
app.use("/api/v1/guests", guestRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/settings", settingsRouter);

// 404 Handler
app.all("/*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
