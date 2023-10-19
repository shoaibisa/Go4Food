const Menu = require("../models/menu");
const Restaurant = require("../models/restaurant");
const Order = require("../models/order");
exports.getAllMenus = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1; // Get the page number from query parameters, default to 1 if not provided
  const perPageMenu = await getMenuLimited(page);
  // console.log(perPageMenu);
  // lates by date
  Menu.find()
    .populate("restaurant")
    .populate("reviews")

    .then((menus) => {
      res.render("allItems", {
        per_menus: perPageMenu,
        allMenus: menus,
        msg: null,
        customer: req.session.customer,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// get only 3 menu then next three menu
const getMenuLimited = () => {
  // based one review rating and number of orders
  // whose number of orders is more
  return Menu.find()

    .populate("restaurant")
    .populate("reviews")
    .sort({ createdAt: -1 })
    .then((menus) => {
      return menus;
    });
};

exports.getMenu = async (req, res, next) => {
  const id = req.params.id;

  const num_orders = await Order.find({ "menus.menu_id": id }).then(
    (orders) => {
      return orders.length;
    }
  );
  Menu.findById(id)
    .populate("restaurant")
    .populate("reviews")
    .populate({
      path: "reviews",
      populate: {
        path: "customer",
        model: "Customer",
      },
    })
    .then((menu) => {
      res.render("DetailDish", {
        menu: menu,
        num_orders: num_orders,
        msg: null,
        customer: req.session.customer,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAllRestaurent = (req, res, next) => {
  Restaurant.find()
    .then((restaurants) => {
      res.render("allRestaurent", {
        allRestaurent: restaurants,
        msg: null,
        customer: req.session.customer,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSearch = async (req, res, next) => {
  const search = req.query.search;
  // also search on restaurant name
  const restaurant = await Restaurant.find({
    name: { $regex: search, $options: "$i" },
  });
  // search on eithe name, tags, description
  const menus = await Menu.find({
    $or: [
      { title: { $regex: search, $options: "$i" } },
      { tags: { $regex: search, $options: "$i" } },
      { description: { $regex: search, $options: "$i" } },
    ],
  })

    .populate("restaurant")
    .populate("reviews")
    .then((menus) => {
      return menus;
    });

  res.render("search", {
    allMenus: menus,
    allRestaurent: restaurant,
    msg: null,
    customer: req.session.customer,
  });
};

exports.getRestaurantDetail = (req, res, next) => {
  const id = req.params.id;
  Restaurant.findById(id)
    .populate("menu")
    .then((restaurant) => {
      res.render("restaurant-items", {
        restaurant: restaurant,
        msg: null,
        allMenus: restaurant.menu,
        customer: req.session.customer,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
