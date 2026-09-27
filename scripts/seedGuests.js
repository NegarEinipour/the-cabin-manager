const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Guest = require("../models/guestModel");
const guestsData = require("../dev-data/data/guests");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const seedGuests = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);

    await Guest.deleteMany();

    const inserted = await Guest.insertMany(guestsData);

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedGuests();
