const mongoose = require('mongoose');
const moment = require('moment');

const sellerImageSchema = new mongoose.Schema({
    image: String,
    path: String,
    date: {
        type: String,
        default: moment().format('DD/MM/YYYY')
    }
}, { timestamps: true });


const sellerImage = mongoose.model('sellerImage', sellerImageSchema);
module.exports = sellerImage;