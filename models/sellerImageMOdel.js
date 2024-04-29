const mongoose = require('mongoose');
const moment = require('moment');

const sellerImageSchema = new mongoose.Schema({
    userGSTIN: {
        type: String,

    },

    image: String,
    path: String,
    date: {
        type: String,
        default: moment().format('DD/MM/YYYY')
    }
}, { timestamps: true });


module.exports = mongoose.model('sellerImage', sellerImageSchema);
