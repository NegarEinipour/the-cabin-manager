const mongoose = require("mongoose");
const validator = require("validator");

const guestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "A guest must have a full name"],
      trim: true,
      maxlength: [50, "Name must be 50 characters or less"],
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "A guest must have an email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    nationality: {
      type: String,
      default: "Unknown",
    },
    phone: {
      type: String,
      default: "",
    },
    idNumber: {
      type: String,
      default: "",
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: [0, "Total visits cannot be negative"],
    },
    lastVisit: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// VIRTUAL POPULATE: Bookings for this guest
guestSchema.virtual("bookings", {
  ref: "Booking",
  foreignField: "guest",
  localField: "_id",
});

// INDEXES
guestSchema.index({ email: 1 });
guestSchema.index({ fullName: 1 });

const Guest = mongoose.model("Guest", guestSchema);

module.exports = Guest;
