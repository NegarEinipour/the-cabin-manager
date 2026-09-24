// scripts/seedUsers.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/userModel");
const usersData = require("../dev-data/data/users");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../config.env") });

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_LOCAL);

    // Delete existing users
    await User.deleteMany();

    // Insert users
    const inserted = await User.insertMany(usersData);

    // Show inserted users
    inserted.forEach((user) => {
      console.log(`   👤 ${user.name} - ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedUsers();
