const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbStore = require("connect-mongodb-session")(session);
const PORT = 4024;

const bodyParser = require("body-parser");
const db = require("./config/db");

const restaurantRoutes = require("./controllers/restaurant_r");
const customerRoutes = require("./controllers/customer_r");
const productsRoutes = require("./controllers/products_r");
require("dotenv").config();
db.connectDB();
const app = express();

// session store
const store = new mongoDbStore({
  uri: "mongodb://techfest:TeCh%40fest%2323@191.96.57.27:27017/Go4Food?authSource=admin",
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
