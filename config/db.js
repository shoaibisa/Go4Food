const mongoose = require("mongoose");

mongoose.set("strictQuery", true);
exports.connectDB = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017", {
      dbName: "Go4Food",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    .then(() => {
      console.log("mongodb connected");
    })
    .catch((err) => console.log(err.message));

  mongoose.connection.on("connected", () => {
    console.log("Mongoose Connected to db");
  });
};
