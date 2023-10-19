const Restaurant = require("../models/restaurant");
const bcrypt = require("bcrypt");
const Menu = require("../models/menu");
const fs = require("fs");
const fileHelper = require("../utils/file");
const Order = require("../models/order");
const exp = require("constants");

exports.getLogin = (req, res, next) => {
  res.render("restaurant/signin", {
    msg: null,
  });
};

exports.getSingup = (req, res, next) => {
  res.render("restaurant/signup", {
    msg: null,
  });
};

exports.postSignup = async (req, res, next) => {
  const { name, email, cpswd, pswd, address, phone } = req.body;

  const image = req.file.filename;
  //console.log(name, email, pswd, cpswd, address, phone);
  if (cpswd !== pswd) {
    const pathImg = "upload/images/" + image;
    if (fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
    return res.render("restaurant/signup", {
      msg: "Password and confirm password does not match",
    });
  }

  if (await Restaurant.findOne({ email: email })) {
    const pathImg = "upload/images/" + image;

    if (fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
    return res.render("restaurant/signup", {
      msg: "Email already exists",
    });
  }

  bcrypt
    .hash(pswd, 12)
    .then((hashedPassword) => {
      const restaurant = new Restaurant({
        name,
        email,
        image,
        password: hashedPassword,
        address,
        phone,
      });
      return restaurant.save();
    })
    .then((result) => {
      res.render("restaurant/signin", {
        msg: "Account created successfully",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// login
exports.postLogin = (req, res, next) => {
  const { email, pswd } = req.body;
  //   return console.log(email, pswd);
  Restaurant.findOne({ email: email })
    .then((restaurant) => {
      if (!restaurant) {
        res.render("restaurant/signin", {
          msg: "Invalid email or password",
        });
      }
      bcrypt
        .compare(pswd, restaurant.password)
        .then((doMatch) => {
          if (doMatch) {
            // req.session.isLoggedIn = true;
            req.session.restaurant = restaurant;
            return req.session.save((err) => {
              //   console.log(err);
              res.redirect("/restaurant/dashboard");
            });
          }
          res.render("restaurant/signin", {
            msg: "Invalid email or password",
          });
        })
        .catch((err) => {
          console.log(err);
          res.render("restaurant/signin", {
            msg: "Invalid email or password",
          });
        });
    })
    .catch((err) => console.log(err));
};

exports.dashboard = async (req, res, next) => {
  // pending oreder nums
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  // filter and
  const menus_name = [];
  const menus_orders = [];
  const menus = await Menu.find({ restaurant: req.session.restaurant._id });
  for (let i = 0; i < menus.length; i++) {
    // remove space from menu name
    menus_name.push(menus[i].title);
    const orders = await Order.find({ "menus.menu_id": menus[i]._id });
    menus_orders.push(orders.length + orders.history);
  }
  res.render("restaurant/dashboard", {
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
    menus_name: menus_name,
    menus_orders: menus_orders,
  });
};

exports.logout = (req, res, next) => {
  req.session.restaurant = null;
  res.redirect("/restaurant/login");
};

exports.getProfile = async (req, res, next) => {
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/Profile", {
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};
exports.getEditprofile = async (req, res, next) => {
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/edit-profile", {
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.postEditprofile = async (req, res, next) => {
  const { name, email, address, phone } = req.body;
  const restaurant = await Restaurant.findById(req.session.restaurant._id);
  restaurant.name = name;
  restaurant.email = email;
  restaurant.address = address;
  restaurant.phone = phone;
  if (req.file) {
    const image = req.file.filename;
    const pathImg = "upload/images/" + restaurant.image;
    if (fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
    restaurant.image = image;
  }

  await restaurant.save();
  res.redirect("/restaurant/profile");
};

exports.createMenu = async (req, res, next) => {
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/createMenu", {
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};
exports.orderstatus = async (req, res, next) => {
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/orderStatus", {
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};
exports.allMenu = async (req, res, next) => {
  const menus = await Menu.find({ restaurant: req.session.restaurant._id });
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/allMenu", {
    menus: menus,
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.postCreateMenu = async (req, res, next) => {
  const { title, price, description, t, quantity } = req.body;
  // return console.log(tags, t);
  const images = req.files.map((f) => f.filename);
  const restaurant = await Restaurant.findById(req.session.restaurant._id);
  const menu = new Menu({
    title,
    price,
    description,
    images,
    tags: t,
    quantity,
    restaurant: restaurant._id,
  });

  menu
    .save()
    .then((result) => {
      restaurant.menu.push(result._id);
      return restaurant.save();
    })
    .then((result) => {
      res.redirect("/restaurant/dashboard");
    })
    .catch((err) => console.log(err));
};

exports.orderstatus = async (req, res, next) => {
  const { order_id } = req.params;
  const order = await Order.findById(order_id)
    .populate("customer")
    .populate("menus.menu_id");
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/orderStatus", {
    order: order,
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.postUpdateOrder = async (req, res, next) => {
  const { order_id, status } = req.body;
  // return console.log(order_id, status);
  const order = await Order.findById(order_id);
  order.shippingDetails.orderTracking = status;
  if (status == 5) {
    order.status = "delivered";
  }
  await order.save();
  res.redirect("/restaurant/updateorder/" + order_id);
};
exports.postUpdateOrderDriver = async (req, res, next) => {
  const { order_id, title } = req.body;
  // return console.log(title[0]);
  const o = await Order.findById(order_id);
  o.shippingDetails.deliveryPerson = title[0];
  o.shippingDetails.phone = title[1];
  o.shippingDetails.orderTracking = 3;
  await o.save();
  res.redirect("/restaurant/updateorder/" + order_id);
};

exports.orderNotification = async (req, res, next) => {
  const orders = [];
  const restaurant = await Restaurant.findById(req.session.restaurant._id);
  // return console.log(restaurant);
  for (let i = 0; i < restaurant.orders.length; i++) {
    const menus = [];
    const order = await Order.findOne({
      _id: restaurant.orders[i],
      status: "pending",
    })
      .populate("menus.menu_id")
      .populate("customer");
    if (order == null) continue;
    const menu = await Menu.findById(order.menus.menu_id);

    orders.push({
      order_id: order._id,
      customer: order.customer,
      scheduled: order.scheduled,
      frequency: order.frequency,
      price: order.price,
      status: order.status,
      updatedAt: order.updatedAt,
      menu: menu,
      quantity: order.menus.quantity,
    });
  }
  // return console.log(orders);
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  res.render("restaurant/orderNotification", {
    orders: orders,
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.confirmOrder = async (req, res, next) => {
  const { order_id } = req.body;
  const order = await Order.findById(order_id);
  order.status = "confirmed";
  order
    .save()
    .then((result) => {
      res.redirect("/restaurant/ordernotification");
    })
    .catch((err) => console.log(err));
};
exports.cancelOrder = async (req, res, next) => {
  const { order_id } = req.body;

  const order = await Order.findById(order_id);
  order.status = "cancel";
  order
    .save()
    .then((result) => {
      res.redirect("/restaurant/ordernotification");
    })
    .catch((err) => console.log(err));
};
exports.getConfirmOrders = async (req, res, next) => {
  const orders = [];
  const restaurant = await Restaurant.findById(req.session.restaurant._id);
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });
  // return console.log(restaurant);
  for (let i = 0; i < restaurant.orders.length; i++) {
    // get order whose status is not pending

    const order = await Order.findOne({
      _id: restaurant.orders[i],
      status: { $ne: "pending" },
    });

    if (order == null) continue;

    const menu = await Menu.findById(order.menus.menu_id);

    orders.push({
      order_id: order._id,
      status: order.status,
      price: order.price,
      customer: order.customer,
      menu: menu,
      quantity: order.menus.quantity,
    });
  }
  // return console.log(orders);

  res.render("restaurant/confirmOrders", {
    orders: orders,
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.deleteMenu = async (req, res, next) => {
  const { menu_id } = req.body;
  const menu = await Menu.findById(menu_id);
  const restaurant = await Restaurant.findById(req.session.restaurant._id);
  restaurant.menu.pull(menu_id);
  // delete those images from upload folder
  for (let i = 0; i < menu.images.length; i++) {
    const pathImg = "upload/images/" + menu.images[i];
    if (fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
  }
  // delete all order from db data whose menu is deleted

  const orders = await Order.deleteMany({ "menus.menu_id": menu_id });

  await restaurant.save();
  await Menu.findByIdAndDelete(menu_id);
  res.redirect("/restaurant/allmenu");
};

exports.getEditMenu = async (req, res, next) => {
  const { menu_id } = req.body;
  const menu = await Menu.findById(menu_id);
  const num_pending_orders = await Order.find({
    restaurant: req.session.restaurant._id,
    status: "pending",
  }).then((orders) => {
    return orders.length;
  });

  res.render("restaurant/edit-menu", {
    menu: menu,
    restaurant: req.session.restaurant,
    num_pending_orders: num_pending_orders,
  });
};

exports.postEditMenu = async (req, res, next) => {
  var { menu_id, title, price, description, t, quantity } = req.body;
  // return console.log(t, req.files);
  const menu = await Menu.findById(menu_id);
  if (t == undefined) {
    t = menu.tags;
  }
  if (quantity == undefined) {
    quantity = menu.quantity;
  }
  var images = menu.images;
  // return console.log(req.files.length);
  if (req.files.length == 0) {
    images = menu.images;
  }
  if (title == undefined) {
    title = menu.title;
  }
  if (price == undefined) {
    price = menu.price;
  }
  if (description == undefined) {
    description = menu.description;
  }

  if (req.files.length > 0) {
    images = req.files.map((f) => f.filename);
    // delete those images from upload folder
    for (let i = 0; i < menu.images.length; i++) {
      const pathImg = "upload/images/" + menu.images[i];
      if (fs.existsSync(pathImg)) {
        fileHelper.deleteFiles(pathImg);
      }
    }
  }

  menu.title = title;
  menu.price = price;
  menu.description = description;
  menu.tags = t;
  menu.quantity = quantity;
  menu.images = images;
  await menu.save();
  res.redirect("/restaurant/allmenu");
};
