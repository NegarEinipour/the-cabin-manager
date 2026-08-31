const Guest = require("../models/guestModel");
const factory = require("../utils/handlerFactory");

exports.getAllGuests = factory.getAll(Guest);
exports.getGuest = factory.getOne(Guest);
exports.createGuest = factory.createOne(Guest);
exports.updateGuest = factory.updateOne(Guest);
exports.deleteGuest = factory.deleteOne(Guest);
