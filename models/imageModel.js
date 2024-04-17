const mongoose = require('mongoose');
const moment = require('moment');

const imageSchema = new mongoose.Schema({
    image: String,
    path: String,
    date: {
        type: String,
        default: moment().format('DD/MM/YYYY')
    }
}, { timestamps: true });


module.exports = mongoose.model('Image', imageSchema);
