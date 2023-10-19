const express = require("express");
const router = express.Router();
const {
  getAllMenus,
  getMenu,
  getAllRestaurent,
  getSearch,
  getRestaurantDetail,
} = require("../controllers/products");

router.get("/", getAllMenus);
router.get("/dish/:id", getMenu);
router.get("/allrestaurent", getAllRestaurent);
router.get("/search", getSearch);
router.get("/restaurant-detail/:id", getRestaurantDetail);

module.exports = router;
