const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
  name: String,
  email: String,
  password: String,
  address: String,
  phone: String,
  image: String,
  description: String,
  menu: [
    {
      type: Schema.Types.ObjectId,
      ref: "Menu",
    },
  ],
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
