const catchAsync = require("./catchAsync");
const AppError = require("./AppError");

exports.getAll = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find();

    if (populateOptions) query = query.populate(populateOptions);

    const docs = await query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: { data: docs },
    });
  });

exports.getOne = (Model, popOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    Object.keys(req.body).forEach((key) => {
      doc[key] = req.body[key];
    });

    await doc.save({ runValidators: true });

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
};

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};
