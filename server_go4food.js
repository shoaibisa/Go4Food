const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbStore = require("connect-mongodb-session")(session);
const PORT = process.env.PORT || 4024;

const bodyParser = require("body-parser");
const { connectDB } = require("./config/db");

const restaurantRoutes = require("./controllers/restaurant_r");
const customerRoutes = require("./controllers/customer_r");
const productsRoutes = require("./controllers/products_r");
require("dotenv").config();
connectDB();
const app = express();
const MONGO_URI=process.env.MONGO_ONLINE+"Go4Food";
// session store
const store = new mongoDbStore({
  uri: MONGO_URI,
  collection: "sessions",
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use("/images", express.static("upload/images"));

// session middleware
app.use(
  session({
    secret: "My love for food",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// restaurant routes
app.use("/restaurant", restaurantRoutes);
app.use(customerRoutes);
app.use(productsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
