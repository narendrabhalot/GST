const mongoose = require('mongoose');
const moment = require('moment');

const purchaserImageSchema = new mongoose.Schema({
    userGSTIN: {
        type: String,

    },
    image: String,
    path: String,
    date: {
        type: Date,
        default: () => moment().toDate()
    }
}, { timestamps: true });


module.exports = mongoose.model('PurchaserImage', purchaserImageSchema);
