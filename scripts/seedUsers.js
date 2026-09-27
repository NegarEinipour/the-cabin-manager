const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/userModel");
const usersData = require("../dev-data/data/users");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);

    await User.deleteMany();

    await User.create(usersData);

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedUsers();
