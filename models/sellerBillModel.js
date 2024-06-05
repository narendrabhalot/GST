const mongoose = require('mongoose');
const moment = require('moment');

const sellerBillSchema = new mongoose.Schema({
    userGSTIN: {
        type: String,
        required: true,
        trim: true,
    },
    invoiceNo: {
        type: String,
        trim: true,
        default: moment().utc()
    },
    invoiceDate: {
        type: Date,
        required: true,
        trim: true,
    },
    sellerGSTIN: {
        type: String,
        trim: true,
        uppercase: true,
        set: (sellerGSTIN) => sellerGSTIN?.toUpperCase(),
    },
    sellerName: {
        type: String,
        required: true,
        trim: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        trim: true,
    },
    gstRate: {
        type: Number,
        required: true,
        trim: true,
    },
    grandTotal: {
        type: Number,
        required: true,
        trim: true,
    },
    totalTaxPaid: {
        type: Number,
        default: 0
    },
    cess: {
        type: Number,
        default: 0
    },
    SGST: {
        type: Number,
        default: 0
    },
    CGST: {
        type: Number,
        default: 0,
    },
    IGST: {
        type: Number,
        default: 0,
    },
    sellerType: {
        type: String,
        trim: true,
        required: true,
        enum: ["cashSale", "gstSale"],
    },
}, { timestamps: true });

sellerBillSchema.virtual('formattedDate').get(function () {
    return moment(this.invoiceDate).format('DD/MM/YYYY');
});

const UserBill = mongoose.model('sellerBill', sellerBillSchema);
module.exports = UserBill;
