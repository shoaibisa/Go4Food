const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const menuSchema = new Schema(
  {
    title: String,
    price: Number,
    images: [String],
    description: String,
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    quantity: Number,
    tags: [String],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
