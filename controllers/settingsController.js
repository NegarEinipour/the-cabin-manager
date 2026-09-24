// controllers/settingsController.js
const Settings = require("../models/settingsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// ─── GET SETTINGS ───
exports.getSettings = catchAsync(async (req, res, next) => {
  // Get the first settings document (there should only be one)
  let settings = await Settings.findOne();

  // If no settings exist, create default ones
  if (!settings) {
    settings = await Settings.create({});
  }

  res.status(200).json({
    status: "success",
    data: { settings },
  });
});

// ─── UPDATE SETTINGS ───
exports.updateSettings = catchAsync(async (req, res, next) => {
  // Find and update settings (or create if doesn't exist)
  const settings = await Settings.findOneAndUpdate(
    {}, // Empty filter = find first document
    req.body,
    {
      new: true,
      runValidators: true,
      upsert: true, // Create if doesn't exist
    },
  );
  res.status(200).json({
    status: "success",
    data: { settings },
  });
});
