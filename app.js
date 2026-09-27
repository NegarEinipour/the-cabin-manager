const express = require("express");
const app = express();
const cors = require("cors");
const AppError = require("./utils/AppError");
const errorHandler = require("./controllers/errorController");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");

const userRouter = require("./routes/userRoutes");
const cabinRouter = require("./routes/cabinRoutes");
const guestRouter = require("./routes/guestRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const settingsRouter = require("./routes/settingsRoutes");

dotenv.config({ path: "./.env" });

const storage = multer.memoryStorage();

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

const uploadCabinImage = upload.single("image");

app.locals.uploadCabinImage = uploadCabinImage;

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://your-production-domain.com"
      : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.set("query parser", "extended");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/cabins", cabinRouter);
app.use("/api/v1/guests", guestRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/settings", settingsRouter);

app.all("/*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

module.exports = app;
