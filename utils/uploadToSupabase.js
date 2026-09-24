// utils/uploadToSupabase.js
const fs = require("fs");
const supabase = require("../config/supabase");

/**
 * Upload either a buffer (from Multer) or a file path (from scripts).
 */
async function uploadImageToSupabase(source, bucket = "users", options = {}) {
  let buffer, mimetype, filename;

  if (typeof source === "string") {
    // path mode (seed scripts)
    buffer = fs.readFileSync(source);
    mimetype = "image/jpeg";
    filename = options.filename || require("path").basename(source);
  } else {
    // Multer File mode
    buffer = source.buffer;
    mimetype = source.mimetype;
    filename = source.originalname;
  }

  const filePath = `${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: mimetype, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

module.exports = { uploadImageToSupabase };
