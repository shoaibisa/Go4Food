const Restaurant = require("../models/restaurant");

module.exports = async (req, res, next) => {
  if (!req.session.restaurant) {
    return res.redirect("/restaurant/login");
  }
  req.session.restaurant = await Restaurant.findById(
    req.session.restaurant._id
  );
  next();
};
