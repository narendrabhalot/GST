
require('dotenv').config();
const express = require("express");
const session = require('express-session')
const bodyParser = require("body-parser");
const route = require("./routes/route");
const mongoose = require("mongoose");
const cors= require('cors')
const dbConnectionString = process.env.DB_CONNECTION_STRING;
const sessionSecret = process.env.SESSION_SECRET;
const app = express();
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
}));
app.use(cors({
    origin: 'http://104.237.8.163:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable if you need to send cookies with the request
  }));
app.use("/", route);
mongoose
    .connect(dbConnectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => console.log("MongoDb is connected / GSTDatabase"))
    .catch((err) => console.log(err));


app.listen(`${process.env.PORT || PORT}`, function () {
    console.log(`Express app running on port ${process.env.PORT || PORT} `);
});
