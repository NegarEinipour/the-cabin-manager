const mongoose = require("mongoose");

const cabinSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A cabin must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "Cabin name must be 40 characters or less"],
      minlength: [3, "Cabin name must be at least 3 characters"],
    },
    maxCapacity: {
      type: Number,
      required: [true, "A cabin must have a maximum capacity"],
      min: [1, "Capacity must be at least 1"],
      max: [10, "Capacity cannot exceed 10"],
    },
    regularPrice: {
      type: Number,
      required: [true, "A cabin must have a regular price"],
      min: [0, "Price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      validate: {
        validator: function (val) {
          if (this.regularPrice === undefined) {
            return true;
          }
          return val < this.regularPrice;
        },
        message: "Discount ({VALUE}) must be less than regular price",
      },
    },
    description: {
      type: String,
      required: [true, "A cabin must have a description"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    image: {
      type: String,
      required: [true, "A cabin must have an image"],
    },
    amenities: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cabinSchema.virtual("discountedPrice").get(function () {
  if (this.discount > 0) {
    return this.regularPrice - this.discount;
  }
  return this.regularPrice;
});

cabinSchema.virtual("bookings", {
  ref: "Booking",
  foreignField: "cabin",
  localField: "_id",
});

cabinSchema.index({ name: 1 });
cabinSchema.index({ isAvailable: 1 });
cabinSchema.index({ regularPrice: 1 });

const Cabin = mongoose.model("Cabin", cabinSchema);

module.exports = Cabin;
