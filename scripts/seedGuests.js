// scripts/seedGuests.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path"); // ← Add this line
const Guest = require("../models/guestModel");
const guestsData = require("../dev-data/data/guests");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../config.env") });

// Main seed function
const seedGuests = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_LOCAL);

    // Delete existing guests
    await Guest.deleteMany();

    // Insert guests
    const inserted = await Guest.insertMany(guestsData);
    console.log(`Successfully imported ${inserted.length} guests!`);

    // Show inserted guests
    inserted.forEach((guest) => {
      console.log(`   👤 ${guest.fullName} - ${guest.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedGuests();
