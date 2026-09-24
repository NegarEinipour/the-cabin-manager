// models/settingsModel.js
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // ─── HOTEL INFO ───
    hotelName: {
      type: String,
      default: "The Wild Oasis",
    },
    hotelAddress: {
      type: String,
      default: "123 Wilderness Road, Nature Valley",
    },
    hotelPhone: {
      type: String,
      default: "+1-800-WILD-OASIS",
    },
    hotelEmail: {
      type: String,
      default: "info@wildoasis.com",
    },

    // ─── BOOKING RULES ───
    minBookingLength: {
      type: Number,
      default: 1,
      min: 1,
      max: 30,
    },
    maxBookingLength: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    maxGuestsPerBooking: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },

    // ─── PRICING ───
    breakfastPrice: {
      type: Number,
      default: 15,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "CAD"],
    },
    taxRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1,
    },

    // ─── POLICIES ───
    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },
    cancellationDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 30,
    },
  },
  {
    timestamps: true,
  },
);

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
