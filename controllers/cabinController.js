// controllers/cabinController.js
const Cabin = require("../models/cabinModel");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.getAllCabins = factory.getAll(Cabin);
exports.getCabin = factory.getOne(Cabin);
exports.createCabin = factory.createOne(Cabin);
exports.updateCabin = factory.updateOne(Cabin);
exports.deleteCabin = factory.deleteOne(Cabin);
