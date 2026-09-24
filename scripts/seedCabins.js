// scripts/seedCabins.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");
const Cabin = require("../models/cabinModel");
const cabinsData = require("../dev-data/data/cabin");

// Load environment variables
dotenv.config({ path: "./.env" });

// Upload image to Supabase
const uploadImageToSupabase = async (imagePath, imageName) => {
  try {
    // 1. Read the image file from my computer
    const imageBuffer = fs.readFileSync(imagePath);

    // 2. Create a unique filename (so images don't overwrite each other)
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${imageName}`;
    const filePath = `cabins/${uniqueFileName}`;

    // 3. Upload to Supabase
    const { data, error } = await supabase.storage
      .from("cabins")
      .upload(filePath, imageBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (error) throw error;

    // 4. Get the public URL of the uploaded image
    const { data: urlData } = supabase.storage
      .from("cabins")
      .getPublicUrl(filePath);

    // 5.
    // Takes an image from my local folder and uploads it to Supabase, then returns a URL like:
    //https://srgkppelflgzpcvofqzi.supabase.co/storage/v1/object/public/cabins/cabins/1234567890-cabin-001.jpg
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Upload failed for ${imageName}:`, error.message);
    return null;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_LOCAL);

    // Delete existing cabins
    await Cabin.deleteMany();

    // Upload images and prepare data
    const cabinsWithUrls = [];
    const imagesFolder = path.join(__dirname, "../dev-data/imgs");
    //imagesFolder = "C:\Users\negar\Desktop\the wild oasis backend\dev-data\imgs"

    for (const cabin of cabinsData) {
      const imagePath = path.join(imagesFolder, cabin.image);
      //imagePath = "C:\Users\negar\Desktop\the wild oasis backend\dev-data\imgs\cabin-001.jpg"

      if (!fs.existsSync(imagePath)) {
        console.warn(`⚠️  Image not found: ${cabin.image}`);
        continue;
      }

      const imageUrl = await uploadImageToSupabase(imagePath, cabin.image);

      // if (!imageUrl) continue;

      cabinsWithUrls.push({
        name: cabin.name,
        maxCapacity: cabin.maxCapacity,
        regularPrice: cabin.regularPrice,
        discount: cabin.discount || 0,
        description: cabin.description,
        image: imageUrl || "https://via.placeholder.com/300x200?text=Cabin",
      });
    }

    // Insert into MongoDB
    if (cabinsWithUrls.length > 0) {
      const inserted = await Cabin.insertMany(cabinsWithUrls);
      console.log(`\n✅ Successfully imported ${inserted.length} cabins!`);
    }

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedDatabase();
