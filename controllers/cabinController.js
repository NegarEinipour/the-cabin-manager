const Cabin = require("../models/cabinModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const supabase = require("../config/supabase");

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

const deleteImageFromSupabase = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("supabase.co")) {
    return;
  }

  try {
    const urlParts = imageUrl.split("/");
    const cabinsIndex = urlParts.indexOf("cabins");
    const filePath = urlParts.slice(cabinsIndex + 1).join("/");

    const { error } = await supabase.storage.from("cabins").remove([filePath]);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

exports.createCabin = catchAsync(async (req, res, next) => {
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

  const io = req.app.get("io");
  io.emit("cabin:created", cabin);

  res.status(201).json({
    status: "success",
    data: { data: cabin },
  });
});

exports.updateCabin = catchAsync(async (req, res, next) => {
  const cabin = await Cabin.findById(req.params.id);
  if (!cabin) {
    return next(new AppError("No cabin found with that ID", 404));
  }

  let imageUrl = cabin.image;
  if (req.file) {
    imageUrl = await uploadToSupabase(req.file.buffer, req.file.originalname);
  }

  if (req.body.name) cabin.name = req.body.name;
  if (req.body.maxCapacity) cabin.maxCapacity = Number(req.body.maxCapacity);
  if (req.body.regularPrice) cabin.regularPrice = Number(req.body.regularPrice);
  if (req.body.discount !== undefined)
    cabin.discount = Number(req.body.discount);
  if (req.body.description) cabin.description = req.body.description;
  cabin.image = imageUrl;

  await cabin.save({ runValidators: true });

  const io = req.app.get("io");
  io.emit("cabin:updated", cabin);

  res.status(200).json({
    status: "success",
    data: { data: cabin },
  });
});

exports.deleteCabin = catchAsync(async (req, res, next) => {
  const cabin = await Cabin.findById(req.params.id);

  if (!cabin) {
    return next(new AppError("No cabin found with that ID", 404));
  }

  await deleteImageFromSupabase(cabin.image);

  await Cabin.findByIdAndDelete(req.params.id);

  await Booking.deleteMany({ cabin: req.params.id });

  const io = req.app.get("io");
  io.emit("cabin:deleted", req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getAllCabins = factory.getAll(Cabin);
exports.getCabin = factory.getOne(Cabin);
