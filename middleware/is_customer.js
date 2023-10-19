const Customer = require("../models/customer");
module.exports = async (req, res, next) => {
  if (!req.session.customer) {
    return res.redirect("/login");
  }
  req.session.customer = await Customer.findById(req.session.customer._id);
  next();
};
