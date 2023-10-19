const Customer = require("../models/customer");
const Cart = require("../models/cart");
const Menu = require("../models/menu");
const bcrypt = require("bcrypt");
const Order = require("../models/order");
const Restaurant = require("../models/restaurant");
const Review = require("../models/review");
const fs = require("fs");
const fileHelper = require("../utils/file");

exports.login = (req, res, next) => {
  res.render("customer/signin", {
    msg: null,
  });
};

exports.signup = (req, res, next) => {
  res.render("customer/signup", {
    msg: null,
  });
};

exports.postSignup = async (req, res, next) => {
  const { name, email, cpswd, pswd, address, phone } = req.body;
  if (cpswd !== pswd) {
    return res.render("customer/signup", {
      msg: "Password and confirm password does not match",
    });
  }
  const c = await Customer.findOne({ email: email });
  if (c) {
    return res.render("customer/signup", {
      msg: "Email already exists",
    });
  }

  bcrypt
    .hash(pswd, 12)
    .then((hashedPassword) => {
      const customer = new Customer({
        name,
        email,
        password: hashedPassword,
        address,
        phone,
      });
      return customer.save();
    })
    .then((result) => {
      res.render("customer/signin", {
        msg: "Account created successfully",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogin = (req, res, next) => {
  const { email, pswd } = req.body;
  //   return console.log(email, pswd);
  Customer.findOne({ email: email })
    .then((customer) => {
      if (!customer) {
        res.render("customer/signin", {
          msg: "Invalid email or password",
        });
      }
      bcrypt
        .compare(pswd, customer.password)
        .then((doMatch) => {
          if (doMatch) {
            // req.session.isLoggedIn = true;
            req.session.customer = customer;
            return req.session.save((err) => {
              //   console.log(err);
              res.redirect("/dashboard");
            });
          }
          res.render("customer/signin", {
            msg: "Invalid email or password",
          });
        })
        .catch((err) => {
          console.log(err);
          res.render("customer/signin", {
            msg: "Invalid email or password",
          });
        });
    })
    .catch((err) => console.log(err));
};

exports.logout = (req, res, next) => {
  req.session.customer = null;
  res.redirect("/login");
};

exports.getDash = async (req, res, next) => {
  const customer = await Customer.findById(req.session.customer._id)
    .populate("orders")
    .populate("reviews");
  res.render("customer/dash", {
    customer: customer,
  });
};

exports.getCart = async (req, res, next) => {
  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  if (!c.cart) {
    const cart = new Cart({
      customer: c._id,
      menus: [],
    });
    await cart.save();
    c.cart = cart._id;
    await c.save();
  }
  Cart.findById(c.cart)
    .populate("menus.menu_id")
    .then((cart) => {
      res.render("customer/cart", {
        customer: req.session.customer,
        cart: cart,
        msg: null,
      });
    });
};

exports.addToCart = async (req, res, next) => {
  const { menu_id } = req.body;
  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  if (!c.cart) {
    const cart = new Cart({
      customer: c._id,
      menus: [],
    });
    await cart.save();
    c.cart = cart._id;
    await c.save();
  }
  const cart = await Cart.findById(c.cart);
  const menu = await Menu.findById(menu_id);
  //   find menu in cart.menu and increase quantity
  const index = cart.menus.findIndex((m) => m.menu_id.toString() === menu_id);
  if (index !== -1) {
    cart.menus[index].quantity = cart.menus[index].quantity + 1;
    cart.total = cart.total + cart.menus[index].quantity - 1;
  } else {
    cart.total = cart.total + 1;
    cart.menus.push({
      menu_id: menu_id,
      quantity: 1,
    });
  }

  cart.price = cart.price + menu.price;

  await cart.save();
  res.redirect("/cart");
};

exports.removeFromCart = async (req, res, next) => {
  const { id } = req.body;

  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  const cart = await Cart.findById(c.cart).populate("menus.menu_id");
  const menu_to_remove = cart.menus.find(
    (m) => m.menu_id._id.toString() === id.toString()
  );
  //   return console.log(menu_to_remove);
  cart.total = cart.total - menu_to_remove.quantity;
  cart.price =
    cart.price - menu_to_remove.menu_id.price * menu_to_remove.quantity;

  cart.menus = cart.menus.filter((m) => m.menu_id._id.toString() !== id);

  await cart.save();
  res.redirect("/cart");
};

exports.buyNow = async (req, res, next) => {
  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  const cart = await Cart.findById(c.cart).populate("menus.menu_id");
  res.render("customer/Payment", {
    customer: req.session.customer,
    type: "multiple",
    menus: cart.menus,
    cart: cart,
    msg: null,
  });
};

exports.buyNowSingle = async (req, res, next) => {
  const menu_id = req.body.menu_id;

  const menu = await Menu.findById(menu_id);
  res.render("customer/Payment", {
    customer: req.session.customer,
    type: "single",
    menu: menu,

    msg: null,
  });
};

exports.paymentBuyNow = async (req, res, next) => {
  const { type } = req.body;

  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  if (type === "single") {
    const { menu_id } = req.body;
    const menu = await Menu.findById(menu_id);
    const qty = req.body.quantity | 1;
    if (req.body.amount < menu.price) {
      return res.render("customer/Payment", {
        customer: req.session.customer,
        type: type,
        menu: menu,
        msg: "Insufficient balance",
      });
    }
    if (qty > menu.quantity) {
      return res.render("customer/Payment", {
        customer: req.session.customer,
        type: type,
        menu: menu,
        msg: "Insufficient quantity",
      });
    }

    const order = new Order({
      customer: c._id,
      restaurants: menu.restaurant,
      menus: {
        menu_id: menu._id,
        quantity: qty,
      },
      totalQty: req.body.quantity,
      price: menu.price * qty,
      status: "pending",
      paymentDetails: {
        cardName: req.body.cardName,
        cardNumber: req.body.cardNumber,
        expiryDate: req.body.expiryDate,
        cvc: req.body.cvc,
        billingAddress: req.body.billingAddress,
        amount: req.body.amount,
      },
    });
    await order.save();
    c.orders.push(order._id);
    await c.save();
    const restaurant = await Restaurant.findById(menu.restaurant);
    restaurant.orders.push(order._id);
    await restaurant.save();
    menu.quantity = menu.quantity - qty;

    res.redirect("/orders");
  } else {
    const cart = await Cart.findById(c.cart).populate("menus.menu_id");
    if (req.body.amount < cart.price) {
      return res.render("customer/Payment", {
        customer: req.session.customer,
        type: type,
        cart: cart,
        menus: cart.menus,
        msg: "Insufficient balance",
      });
    }

    // create multiple order based in menus

    for (let i = 0; i < cart.menus.length; i++) {
      if (cart.menus[i].quantity > cart.menus[i].menu_id.quantity) {
        return res.render("customer/Payment", {
          customer: req.session.customer,
          type: type,
          cart: cart,
          menus: cart.menus,
          msg: "Insufficient quantity",
        });
      }
      const order = new Order({
        customer: c._id,
        restaurants: cart.menus[i].menu_id.restaurant,
        menus: {
          menu_id: cart.menus[i].menu_id._id,
          quantity: cart.menus[i].quantity,
        },
        totalQty: cart.menus[i].quantity,
        price: cart.menus[i].menu_id.price * cart.menus[i].quantity,
        status: "pending",
        paymentDetails: {
          cardName: req.body.cardName,
          cardNumber: req.body.cardNumber,
          expiryDate: req.body.expiryDate,
          cvc: req.body.cvc,
          billingAddress: req.body.billingAddress,
          amount: cart.menus[i].menu_id.price * cart.menus[i].quantity,
        },
      });
      await order.save();
      c.orders.push(order._id);
      await c.save();
      const restaurant = await Restaurant.findById(
        cart.menus[i].menu_id.restaurant
      );
      restaurant.orders.push(order._id);
      await restaurant.save();
      const menu = await Menu.findById(cart.menus[i].menu_id._id);
      menu.quantity = menu.quantity - cart.menus[i].quantity;
      await menu.save();
    }

    cart.menus = [];
    cart.total = 0;
    cart.price = 0;
    await cart.save();
    res.redirect("/orders");
  }
};

exports.getOrders = async (req, res, next) => {
  const { customer } = req.session;
  const c = await Customer.findById(customer._id)
    .populate("orders")
    .populate({
      path: "orders",
      populate: {
        path: "menus.menu_id",
        model: "Menu",
      },
    });

  //   return console.log(c.orders);
  // delivered orders
  const delivered_orders = c.orders.filter(
    (o) => o.status === "delivered" || o.history > 0
  );
  const rest_delivered_orders = c.orders.filter(
    (o) => o.status !== "delivered"
  );
  res.render("customer/history", {
    orders: rest_delivered_orders,
    delivered_orders: delivered_orders,
    customer: req.session.customer,
  });
};
exports.getSchedule = async (req, res, next) => {
  const customer = await Customer.findById(req.session.customer._id)
    .populate("orders")
    .populate({
      path: "orders",
      populate: {
        path: "menus.menu_id",
        model: "Menu",
      },
    });
  const orders = customer.orders.filter((o) => o.status === "delivered");

  res.render("customer/schedule", {
    customer: req.session.customer,
    orders: orders,
  });
};
exports.postSchedule = async (req, res, next) => {
  const { check, frequency } = req.body;
  // if type of check is not array
  // return console.log(Array.isArray(check));
  if (Array.isArray(check)) {
    for (let i = 0; i < check.length; i++) {
      const order = await Order.findById(check[i]);
      order.scheduled = "true";
      order.frequency = frequency;
      order.status = "pending";

      var history = order.history || 0;
      order.shippingDetails.deliveryPerson = "Yet to be assigned";
      order.shippingDetails.phone = "Yet to be assigned";
      order.shippingDetails.orderTracking = 0;
      order.shippingDetails.expectedTime = frequency;
      order.history = history + 1;
      await order.save();
    }
  } else {
    const order = await Order.findById(check);
    order.scheduled = "true";
    order.frequency = frequency;
    order.status = "pending";
    order.shippingDetails.deliveryPerson = "Yet to be assigned";
    order.shippingDetails.phone = "Yet to be assigned";
    order.shippingDetails.orderTracking = 0;
    order.shippingDetails.expectedTime = frequency;
    var history = order.history || 0;
    // return console.log(order);
    order.history = history + 1;
    await order.save();
  }

  res.redirect("/schedule");
};

exports.trackOrder = async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate("menus.menu_id")
    .populate("restaurants");
  res.render("customer/trackorder", {
    order: order,
    customer: req.session.customer,
  });
};

exports.cancelOrder = async (req, res, next) => {
  const { order_id } = req.body;
  const order = await Order.findById(order_id);
  order.status = "cancel";
  await order.save();
  res.redirect("/orders");
};

exports.getProfile = async (req, res, next) => {
  const { customer } = req.session;
  res.render("customer/Profile", {
    customer: req.session.customer,
  });
};

exports.getEditProfile = async (req, res, next) => {
  const { customer } = req.session;

  res.render("customer/edit-profile", {
    customer: req.session.customer,
  });
};
exports.postEditProfile = async (req, res, next) => {
  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  const { name, email, address, phone } = req.body;
  // return console.log(req.body);
  console.log(name);
  c.name = name;
  c.email = email;
  c.address = address;
  c.phone = phone;
  console.log(req.file);
  if (req.file) {
    const pathImg = "upload/images/" + c.image;
    if (fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
    c.image = req.file.filename;
  }

  await c.save();
  res.redirect("/profile");
};

exports.rating = async (req, res, next) => {
  const { menu_id } = req.body;
  const menu = await Menu.findById(menu_id).populate("reviews");

  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  // 5 stars (weight of 1)
  // 4 stars (weight of 0.75)
  // 3 stars (weight of 0.5)
  // 2 stars (weight of 0.25)
  // 1 star (weight of 0)
  var rating = req.body.rating;
  // and order id is different
  const index = menu.reviews.findIndex(
    (r) =>
      r.customer.toString() === c._id.toString() &&
      r.order === req.body.order_id
  );
  if (index !== -1) {
    const review = await Review.findById(menu.reviews[index]);
    review.rating = rating;
    review.comment = req.body.comment;
    await review.save();

    return res.redirect("/orders");
  }

  const review = new Review({
    customer: c._id,
    menu: menu._id,
    rating: rating,
    comment: req.body.comment,
    order: req.body.order_id,
  });
  // if customer already reviewd this menu then update

  await review.save();
  menu.reviews.push(review._id);
  c.reviews.push(review._id);
  await menu.save();

  res.redirect("/orders");
};

exports.incCart = async (req, res, next) => {
  const { id } = req.body;

  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  const cart = await Cart.findById(c.cart).populate("menus.menu_id");
  const menu_to_inc = cart.menus.find(
    (m) => m.menu_id._id.toString() === id.toString()
  );
  //   return console.log(menu_to_remove);
  if (menu_to_inc.menu_id.quantity <= menu_to_inc.quantity) {
    return res.render("customer/cart", {
      customer: req.session.customer,
      cart: cart,
      msg: "Insufficient quantity",
    });
  }
  cart.total = cart.total + 1;
  cart.price = cart.price + menu_to_inc.menu_id.price;

  menu_to_inc.quantity = menu_to_inc.quantity + 1;

  await cart.save();
  res.redirect("/cart");
};

exports.decCart = async (req, res, next) => {
  const { id } = req.body;

  const { customer } = req.session;
  const c = await Customer.findById(customer._id);
  const cart = await Cart.findById(c.cart).populate("menus.menu_id");
  const menu_to_dec = cart.menus.find(
    (m) => m.menu_id._id.toString() === id.toString()
  );
  //   return console.log(menu_to_remove);
  if (menu_to_dec.quantity === 1) {
    // remvoe the menu from cart
    cart.total = cart.total - 1;
    cart.price = cart.price - menu_to_dec.menu_id.price;
    // remove from order menus
    cart.menus = cart.menus.filter((m) => m.menu_id._id.toString() !== id);
    await cart.save();

    return res.redirect("/cart");
  }
  cart.total = cart.total - 1;
  cart.price = cart.price - menu_to_dec.menu_id.price;

  menu_to_dec.quantity = menu_to_dec.quantity - 1;

  await cart.save();
  res.redirect("/cart");
};
