const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

exports.connectDB = () => {
  mongoose
    .connect(process.env.MONGO_ONLINE, {
      dbName: process.env.MONGO_DB_NAME || "Go4Food", // Using process.env.MONGO_DB_NAME if available, else defaulting to "Go4Food"
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Error connecting to MongoDB:", error));
};
