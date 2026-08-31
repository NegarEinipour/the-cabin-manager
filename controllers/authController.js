const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendCreateToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, //86400000 = 24 * 60 * 60 * 1000 (one day in milliseconds)
    ),
    // secure: true, //the cookie will be send on an encrypted connection
    httpOnly: true, //the cookie can't be accessed or modified by the browser
    sameSite: "lax", // Cookie sent for same-site AND top-level cross-site navigation (like clicking a link)
    path: "/", // Cookie sent to ALL paths
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  //REMOVE THE PASSWORD FROM THE OUTPUT
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

//-SIGNUP
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  sendCreateToken(newUser, 201, res);
});

//-LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. CHECK IF EMAIL AND PASSWORD EXIST
  if (!email || !password) {
    return next(new AppError("Provide email and password", 400));
  }

  //2. IF THE USER EXIST && THE PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select("+password");
  const correct = await user.correctPassword(password, user.password);

  //3. If user doesn't exist OR the password is incorrect → send error
  if (!user || !correct) {
    return next(new AppError("Invalid email or password", 401));
  }

  //4. If everything ok, send token to client
  sendCreateToken(user, 200, res);
});

//-LOGOUT
exports.logout = catchAsync(async (req, res, next) => {
  // Send a new cookie with the same name, but with an expired date
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully!",
  });
});

//-PROTECT
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting the user's token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //2. if no jwt were found either from request's header or request's cookie
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  //3. if the token is found then verify it
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //  Old way — uses callbacks
  //   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  //     if (err) {
  //     } else {
  //       console.log(decoded); // Use decoded data
  //     }
  //   });
  // {
  //   id: '65a1b2c3d4e5f6g7h8i9j0k1', // ← User ID
  //   iat: 1724512345,                // ← When token was created
  //   exp: 1727094345                 // ← When token expires
  // }

  // 4. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }

  // 5. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }

  // 6. GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

//-RESTRICT TO
exports.restrictTo = (...roles) => {
  // roles ['admin', 'manager']
  // This is the actual middleware
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission", 403));
    }
    next();
  };
};

//-FORGET PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.  Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  // 2. Return an error if no user found
  if (!user) {
    return next(new AppError("There is no user with that email", 404));
  }

  // 3. Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //Skips all validators

  try {
    // 4.  Send it back as an email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    console.log("❌ ERROR MESSAGE:", err.message);

    // 5. If the email fails, clean up the token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // 6. Send an error response
    return next(
      new AppError(
        "There was an error sending the email. Try again later.",
        500,
      ),
    );
  }
});

//-RESET PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. GET USER BASED ON THE HASHED TOKEN FROM DATABASE
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token) // "/resetPassword/:token"
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. IF TOKEN HAS NOT EXPIRED AND THERE IS A USER -> SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password; //The new password the user sent
  user.passwordConfirm = req.body.passwordConfirm; //The confirmation of the new password

  // 3.  UPDATE THE CHANGEDPASSWORDAT FOR THE CURRENT USER
  user.passwordResetToken = undefined; //Removes the token so it can't be used again
  user.passwordResetExpires = undefined; //Removes the expiration date

  await user.save(); //Saves the changes to the database

  sendCreateToken(user, 200, res);
});

//-UPDATE PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. GET THE USER FROM COLLECTION
  //req.user.id is the Logged-In User's ID
  const user = await User.findById(req.user.id).select("+password");

  // 2.  CHECK IF THE POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3.  IF SO, UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  sendCreateToken(user, 200, res);
});
