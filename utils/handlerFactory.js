const catchAsync = require("./catchAsync");
const AppError = require("./AppError");

// GET ALL
exports.getAll = (Model) => {
  return catchAsync(async (req, res) => {
    const docs = await Model.find();

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
};

// GET ONE
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

// CREATE ONE
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

// UPDATE ONE
// exports.updateOne = (Model) => {
//   return catchAsync(async (req, res, next) => {
//     const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!doc) {
//       return next(new AppError("No document found with that ID", 404));
//     }

//     res.status(200).json({
//       status: "success",
//       data: {
//         data: doc,
//       },
//     });
//   });
// };
// In your handlerFactory.js
exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Apply updates
    Object.keys(req.body).forEach((key) => {
      doc[key] = req.body[key];
    });

    await doc.save({ runValidators: true }); // ✅ Validation runs correctly

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
};

// DELETE ONE
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
