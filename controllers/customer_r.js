const {
  login,
  signup,
  postSignup,
  postLogin,
  getDash,
  logout,
  getCart,
  addToCart,
  getOrders,
  removeFromCart,
  buyNow,
  paymentBuyNow,
  buyNowSingle,
  trackOrder,
  cancelOrder,
  dishDetails,
  profile,
  getProfile,
  rating,
  getSchedule,
  postSchedule,
  incCart,
  decCart,
  getEditProfile,
  postEditProfile,
} = require("./customer");
const express = require("express");
const is_customer = require("../middleware/is_customer");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/login", login);
router.get("/signup", signup);
router.post("/signup", postSignup);
router.post("/login", postLogin);
router.post("/logout", logout);

router.get("/dashboard", is_customer, getDash);
router.get("/cart", is_customer, getCart);
router.post("/cart", is_customer, addToCart);
router.post("/increment", is_customer, incCart);
router.post("/decrement", is_customer, decCart);

router.get("/orders", is_customer, getOrders);
router.get("/trackorder", is_customer, trackOrder);
router.post("/remove-from-cart", is_customer, removeFromCart);

router.post("/buynow", is_customer, buyNow);
router.post("/buynowsingle", is_customer, buyNowSingle);
router.post("/payment", is_customer, paymentBuyNow);

router.get("/trackorder/:id", is_customer, trackOrder);
router.post("/cancelorder", is_customer, cancelOrder);

router.get("/schedule", is_customer, getSchedule);
router.post("/schedule", is_customer, postSchedule);
router.get("/profile", is_customer, getProfile);

router.post("/rating", is_customer, rating);
router.post(
  "/get-editprofile",

  is_customer,
  getEditProfile
);
router.post(
  "/post-editprofile",

  is_customer,
  upload.single("images"),
  postEditProfile
);

module.exports = router;
