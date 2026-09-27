const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");
const Cabin = require("../models/cabinModel");
const cabinsData = require("../dev-data/data/cabin");

dotenv.config({ path: "./.env" });

const uploadImageToSupabase = async (imagePath, imageName) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);

    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${imageName}`;
    const filePath = `cabins/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from("cabins")
      .upload(filePath, imageBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("cabins")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    return null;
  }
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);

    await Cabin.deleteMany();

    const cabinsWithUrls = [];
    const imagesFolder = path.join(__dirname, "../dev-data/imgs");

    for (const cabin of cabinsData) {
      const imagePath = path.join(imagesFolder, cabin.image);

      if (!fs.existsSync(imagePath)) {
        continue;
      }

      const imageUrl = await uploadImageToSupabase(imagePath, cabin.image);

      cabinsWithUrls.push({
        name: cabin.name,
        maxCapacity: cabin.maxCapacity,
        regularPrice: cabin.regularPrice,
        discount: cabin.discount || 0,
        description: cabin.description,
        image: imageUrl || "https://via.placeholder.com/300x200?text=Cabin",
      });
    }

    if (cabinsWithUrls.length > 0) {
      const inserted = await Cabin.insertMany(cabinsWithUrls);
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedDatabase();
