// config/supabase.js
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Load .env file
dotenv.config({ path: "./config.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Debug: Check if credentials are loaded
console.log("🔍 Checking Supabase credentials...");
console.log("SUPABASE_URL:", supabaseUrl ? "✅ Found" : "❌ Missing");
console.log(
  "SUPABASE_SECRET_KEY:",
  supabaseSecretKey ? "✅ Found" : "❌ Missing",
);

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("Please check SUPABASE_URL and SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("✅ Supabase client initialized");

module.exports = supabase;
