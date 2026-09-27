const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tell us your name"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Provide a valid email"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    password: {
      type: String,
      required: [true, "provide a password"],
      minLength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, " confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "PASSWORDS ARE NOT THE SAME",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["admin", "manager", "receptionist"],
      default: "receptionist",
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.pre("save", async function () {
  if (!this.isModified("password") || this.isNew) {
    return;
  }

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
