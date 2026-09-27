const Settings = require("../models/settingsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.getSettings = catchAsync(async (req, res, next) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  res.status(200).json({
    status: "success",
    data: { settings },
  });
});

exports.updateSettings = catchAsync(async (req, res, next) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    runValidators: true,
    upsert: true,
  });
  res.status(200).json({
    status: "success",
    data: { settings },
  });
});
