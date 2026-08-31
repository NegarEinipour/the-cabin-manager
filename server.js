const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
mongoose
  .connect(process.env.DATABASE_LOCAL)
  .then(() => {
    console.log("🎉 CONNECTED TO DATABASE");
  })
  .catch((err) => {
    console.log(" 💥 DID NOT CONNECTED TO DATABAE", err);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
