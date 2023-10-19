const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  menus: [
    {
      menu_id: {
        type: Schema.Types.ObjectId,
        ref: "Menu",
      },
      quantity: {
        type: Number,
        default: 0,
      },
    },
  ],

  price: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Cart", cartSchema);
