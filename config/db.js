const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
dotenv.config();
mongoose.set("strictQuery", true);
const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI, {user: process.env.MONGO_USER, pass: process.env.MONGO_PWD, dbName: "Go4Food"})
    .then((res) => console.log("Connected to MongoDB".bgBlue));
};

module.exports={connectDB};
