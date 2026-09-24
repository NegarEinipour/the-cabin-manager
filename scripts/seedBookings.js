// scripts/seedBookings.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Booking = require("../models/bookingModel");
const Cabin = require("../models/cabinModel");
const Guest = require("../models/guestModel");
const User = require("../models/userModel");
const bookingsData = require("../dev-data/data/bookings");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../config.env") });

console.log(
  "🔍 DATABASE_LOCAL:",
  process.env.DATABASE_LOCAL ? "✅ Found" : "❌ Missing",
);

const seedBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_LOCAL);
    console.log(" 🎉 Connected to MongoDB");

    // Delete existing bookings
    await Booking.deleteMany();
    console.log("🗑️  Deleted existing bookings");

    // Get all cabins, guests, and users
    const cabins = await Cabin.find();
    const guests = await Guest.find();
    const users = await User.find();

    console.log(
      `📋 Found ${cabins.length} cabins, ${guests.length} guests, and ${users.length} users`,
    );

    // Get the first user (admin) to assign to bookings
    const defaultUser = users.length > 0 ? users[0]._id : null;

    if (!defaultUser) {
      console.warn("⚠️  No users found in database. Please seed users first.");
      console.log("   Run: npm run seed:users");
      process.exit(1);
    }

    // Create maps for quick lookup
    const cabinMap = {};
    cabins.forEach((cabin) => {
      cabinMap[cabin.name] = cabin._id;
    });

    // Prepare bookings with references
    const bookingsWithIds = [];
    let skipped = 0;

    for (const [i, booking] of bookingsData.entries()) {
      // Convert cabinId (1) to cabin name ("001")
      const cabinName = String(booking.cabinId).padStart(3, "0");
      const cabinId = cabinMap[cabinName];

      // Find guest by position in array (guestId is 1-based)
      const guestIndex = booking.guestId - 1;

      if (guestIndex < 0 || guestIndex >= guests.length) {
        console.warn(
          `⚠️  Guest ID ${booking.guestId} out of range (max: ${guests.length})`,
        );
        skipped++;
        continue;
      }

      const guest = guests[guestIndex];

      if (!guest) {
        console.warn(`⚠️  Guest not found for ID: ${booking.guestId}`);
        skipped++;
        continue;
      }

      if (!cabinId) {
        console.warn(
          `⚠️  Cabin not found for: ${cabinName} (from cabinId: ${booking.cabinId})`,
        );
        skipped++;
        continue;
      }

      // Calculate number of nights
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diffTime = Math.abs(end - start);
      const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate cabin price and total price
      const cabin = cabins.find((c) => c._id.toString() === cabinId.toString());
      const cabinPrice = cabin.regularPrice - cabin.discount;
      let totalPrice = cabinPrice * numNights;

      // Add breakfast price if applicable
      let breakfastPrice = 0;
      if (booking.hasBreakfast) {
        breakfastPrice = 15 * numNights * booking.numGuests;
        totalPrice += breakfastPrice;
      }

      bookingsWithIds.push({
        bookingNumber: i + 1,
        cabin: cabinId,
        guest: guest._id,
        user: defaultUser,
        startDate: booking.startDate,
        endDate: booking.endDate,
        numNights: numNights,
        numGuests: booking.numGuests,
        cabinPrice: cabinPrice,
        extrasPrice: 0,
        totalPrice: totalPrice,
        status: booking.status || "unconfirmed",
        hasBreakfast: booking.hasBreakfast,
        isPaid: booking.isPaid,
        observations: booking.observations || "",
      });
    }

    // Insert bookings
    if (bookingsWithIds.length > 0) {
      const inserted = await Booking.insertMany(bookingsWithIds);
      console.log(`✅ Successfully imported ${inserted.length} bookings!`);

      // Show a sample
      console.log("\n📋 Sample booking:");
      const sample = inserted[0];
      console.log(`   Cabin ID: ${sample.cabin}`);
      console.log(`   Guest ID: ${sample.guest}`);
      console.log(`   User ID: ${sample.user}`);
      console.log(`   Dates: ${sample.startDate} to ${sample.endDate}`);
      console.log(`   Total: $${sample.totalPrice}`);
    }

    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} bookings due to missing references`);
    }

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedBookings();
