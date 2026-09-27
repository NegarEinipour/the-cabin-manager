const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

mongoose
  .connect(process.env.DATABASE_LOCAL)
  .then(() => {})
  .catch((err) => {});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

app.set("io", io);

const port = process.env.PORT || 3000;
server.listen(port, () => {});

process.on("unhandledRejection", (err) => {
  server.close(() => {
    process.exit(1);
  });
});
