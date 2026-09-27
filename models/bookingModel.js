const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: Number,
      unique: true,
      required: [true, "A booking must have a booking number"],
    },
    cabin: {
      type: mongoose.Schema.ObjectId,
      ref: "Cabin",
      required: [true, "A booking must belong to a cabin"],
    },
    guest: {
      type: mongoose.Schema.ObjectId,
      ref: "Guest",
      required: [true, "A booking must belong to a guest"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A booking must be created by a staff member"],
    },
    startDate: {
      type: Date,
      required: [true, "A booking must have a start date"],
    },
    endDate: {
      type: Date,
      required: [true, "A booking must have an end date"],
    },
    numNights: {
      type: Number,
      required: [true, "A booking must have a number of nights"],
      min: [1, "Minimum stay is 1 night"],
    },
    numGuests: {
      type: Number,
      required: [true, "A booking must have a number of guests"],
      min: [1, "At least 1 guest required"],
      max: [10, "Maximum 10 guests per booking"],
    },
    cabinPrice: {
      type: Number,
      required: [true, "A booking must have a cabin price"],
    },
    extrasPrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, "A booking must have a total price"],
    },
    status: {
      type: String,
      enum: ["unconfirmed", "checked-in", "checked-out"],
      default: "unconfirmed",
    },
    hasBreakfast: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    observations: {
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

bookingSchema.index({ cabin: 1, startDate: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.virtual("durationWeeks").get(function () {
  return this.numNights / 7;
});

bookingSchema.pre("save", function () {
  this.totalPrice = this.cabinPrice * this.numNights + (this.extrasPrice || 0);
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
