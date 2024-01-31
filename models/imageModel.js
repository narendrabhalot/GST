// models/Image.js

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    image: String,
    path: String,

}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
