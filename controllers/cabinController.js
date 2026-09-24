// controllers/cabinController.js
const Cabin = require("../models/cabinModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const supabase = require("../config/supabase");

// exports.getAllCabins = factory.getAll(Cabin);
// exports.getCabin = factory.getOne(Cabin);
// exports.createCabin = factory.createOne(Cabin);
// exports.updateCabin = factory.updateOne(Cabin);
// exports.deleteCabin = factory.deleteOne(Cabin);

// ─── UPLOAD HELPER ───
const uploadToSupabase = async (fileBuffer, fileName) => {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;
  const filePath = `cabins/${uniqueFileName}`;

  const { data, error } = await supabase.storage
    .from("cabins")
    .upload(filePath, fileBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("cabins")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// ─── CREATE CABIN ───
exports.createCabin = catchAsync(async (req, res, next) => {
  console.log("📥 Creating cabin...");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  if (!req.file) {
    return next(new AppError("Please upload an image for the cabin", 400));
  }

  const imageUrl = await uploadToSupabase(
    req.file.buffer,
    req.file.originalname,
  );

  const cabinData = {
    name: req.body.name,
    maxCapacity: Number(req.body.maxCapacity),
    regularPrice: Number(req.body.regularPrice),
    discount: Number(req.body.discount) || 0,
    description: req.body.description,
    image: imageUrl,
  };

  const cabin = await Cabin.create(cabinData);

  res.status(201).json({
    status: "success",
    data: { data: cabin },
  });
});

// ─── UPDATE CABIN ───
exports.updateCabin = catchAsync(async (req, res, next) => {
  const cabin = await Cabin.findById(req.params.id);
  if (!cabin) {
    return next(new AppError("No cabin found with that ID", 404));
  }

  let imageUrl = cabin.image;
  if (req.file) {
    imageUrl = await uploadToSupabase(req.file.buffer, req.file.originalname);
  }

  // Update fields
  if (req.body.name) cabin.name = req.body.name;
  if (req.body.maxCapacity) cabin.maxCapacity = Number(req.body.maxCapacity);
  if (req.body.regularPrice) cabin.regularPrice = Number(req.body.regularPrice);
  if (req.body.discount !== undefined)
    cabin.discount = Number(req.body.discount);
  if (req.body.description) cabin.description = req.body.description;
  cabin.image = imageUrl;

  await cabin.save({ runValidators: true });

  res.status(200).json({
    status: "success",
    data: { data: cabin },
  });
});

// ─── HELPER: Delete image from Supabase ───
const deleteImageFromSupabase = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("supabase.co")) {
    return; // No image to delete
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split("/");
    const cabinsIndex = urlParts.indexOf("cabins");
    const filePath = urlParts.slice(cabinsIndex + 1).join("/");

    console.log("🗑️ Deleting image:", filePath);

    const { error } = await supabase.storage.from("cabins").remove([filePath]);

    if (error) {
      console.error("Failed to delete image:", error.message);
      return false;
    }

    console.log(" Image deleted successfully");
    return true;
  } catch (error) {
    console.error(" Error deleting image:", error.message);
    return false;
  }
};

// ─── DELETE CABIN ───
exports.deleteCabin = catchAsync(async (req, res, next) => {
  // 1. Find the cabin
  const cabin = await Cabin.findById(req.params.id);

  if (!cabin) {
    return next(new AppError("No cabin found with that ID", 404));
  }

  // 2. Delete image from Supabase
  await deleteImageFromSupabase(cabin.image);

  // 3. Delete cabin from MongoDB
  await Cabin.findByIdAndDelete(req.params.id);

  // delete all bookings that referenced this cabin
  await Booking.deleteMany({ cabin: req.params.id });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ─── GET AND DELETE ───
exports.getAllCabins = factory.getAll(Cabin);
exports.getCabin = factory.getOne(Cabin);
// exports.deleteCabin = factory.deleteOne(Cabin);
