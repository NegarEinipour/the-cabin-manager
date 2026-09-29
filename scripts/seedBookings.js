const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Booking = require("../models/bookingModel");
const Cabin = require("../models/cabinModel");
const Guest = require("../models/guestModel");
const User = require("../models/userModel");
const bookingsData = require("../dev-data/data/bookings");

dotenv.config({ path: path.join(__dirname, "../config.env") });

const seedBookings = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_ATLAS);

    await Booking.deleteMany();

    const cabins = await Cabin.find();
    const guests = await Guest.find();
    const users = await User.find();

    const defaultUser = users.length > 0 ? users[0]._id : null;

    if (!defaultUser) {
      process.exit(1);
    }

    const cabinMap = {};
    cabins.forEach((cabin) => {
      cabinMap[cabin.name] = cabin._id;
    });

    const bookingsWithIds = [];
    let skipped = 0;

    for (const [i, booking] of bookingsData.entries()) {
      const cabinName = String(booking.cabinId).padStart(3, "0");
      const cabinId = cabinMap[cabinName];

      const guestIndex = booking.guestId - 1;

      if (guestIndex < 0 || guestIndex >= guests.length) {
        skipped++;
        continue;
      }

      const guest = guests[guestIndex];

      if (!guest) {
        skipped++;
        continue;
      }

      if (!cabinId) {
        skipped++;
        continue;
      }

      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diffTime = Math.abs(end - start);
      const numNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const cabin = cabins.find((c) => c._id.toString() === cabinId.toString());
      const cabinPrice = cabin.regularPrice - cabin.discount;
      let totalPrice = cabinPrice * numNights;

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
        createdAt: booking.created_at,
        updatedAt: booking.created_at,
      });
    }

    if (bookingsWithIds.length > 0) {
      const inserted = await Booking.insertMany(bookingsWithIds, {
        timestamps: false,
      });
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedBookings();
