
const express = require("express");
const path = require('path')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors')
require('dotenv').config();
const dbConnectionString = process.env.DB_CONNECTION_STRING;
const app = express();
const route = require("./routes/route");
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/", route);
mongoose.connect(dbConnectionString, {
    useUnifiedTopology: true, useNewUrlParser: true
})
app.listen(`${process.env.PORT || PORT}`, function () {
    console.log(`Express app running on port ${process.env.PORT || PORT} `);
}); 
