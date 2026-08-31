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
      lowercase: true, //transform the email to lowercase
      validate: [validator.isEmail, "Provide a valid email"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    }, //path to a photo
    password: {
      type: String,
      required: [true, "provide a password"],
      minLength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, " confirm your password"],
      //THIS ONLY WORKS ON CREATE & SAVE
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

//PRE-SAVE MIDDLEWARE - HASH PASSWORD
userSchema.pre("save", async function () {
  // 1. Only run if password is modified
  if (!this.isModified("password")) {
    return; //return to exit early
  }
  // 2. Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // 3. Remove passwordConfirm (not stored in DB)
  this.passwordConfirm = undefined;
});

//PRE-SAVE MIDDLEWARE - PASSWORD CHANGED AT
userSchema.pre("save", async function () {
  // 1. Only run if password is modified AND user is not new
  if (!this.isModified("password") || this.isNew) {
    return;
  }

  // 2. Set passwordChangedAt (subtract 1 second to be safe)
  this.passwordChangedAt = Date.now() - 1000;
});

//QUERY MIDDLEWARE - EXLUDE INACTIVE USERS
userSchema.pre(/^find/, function (next) {
  // This runs on all find queries (find, findOne, findById, etc.)
  this.find({ active: { $ne: false } });
});

//INSTANCE METHOD - COMPARE PASSWORDS
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//INSTANCE METHOD - CHECKS IF THE THE PASSWORD HAS CHANGED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, //Convert the date to seconds from miliseconds
      10, //Convert to a number
    );
    return JWTTimestamp < changedTimestamp; //Check if token was issued BEFORE password change
  }
  return false;
};

//INSTANCE METHOD - CREATE  PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {
  // 1. Generate a random token
  const resetToken = crypto.randomBytes(32).toString("hex"); //	Generates 32 random bytes then Converts it to a readable hex string

  // 2. Hash the token and store it in the database
  this.passwordResetToken = crypto
    .createHash("sha256") //Creates a SHA-256 hashing algorithm
    .update(resetToken) //Feeds the token into the hash
    .digest("hex"); //Converts the hash to a hexadecimal string

  // 3. Set expiration (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Adds 10 minutes (10 × 60 seconds × 1000 ms)

  // 4. Return the un-hashed token (to send to user via email)
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
