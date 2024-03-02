const mongoose = require('mongoose');
const moment = require('moment');

const purchaserImageSchema = new mongoose.Schema({
    image: String,
    path: String,
    date: {
        type: String,
        default: moment().format('DD/MM/YYYY')
    }
}, { timestamps: true });


const purchaserImage = mongoose.model('purchaserImage', purchaserImageSchema);
module.exports = purchaserImage;
