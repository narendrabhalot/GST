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


const Image = mongoose.model('Image', imageSchema);
module.exports = Image;
