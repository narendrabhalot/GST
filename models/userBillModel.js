const mongoose = require('mongoose');
const userBillSchema = new mongoose.Schema({

    invoiceNo: {
        type: String,
        required: true,
        trim: true,
    },
    invoiceDate: {
        type: String,
        required: true,
        trim: true,
    },
    sellerGSTIN: {
        type: String,
        required: true,
        trim: true,
    },
    totalAmount: {
        type: String,
        required: true,
        trim: true,
    },
    gstRate: {
        type: String,
        trim: true,
    },
    grandTotal: {
        type: String,
        required: true,
        trim: true,
    },
    totalTaxPaid: {
        type: Number,
        default: 0
    },
    SGST: {
        type: Number,
        trim: true,
        default: 0
    },
    CGST: {
        type: Number,
        trim: true,
        default: 0,
    },
    IGST: {
        type: Number,
        trim: true,
        default: 0,
    },
}, { "timestamps": true });
const userBill = mongoose.model('userBillSchema', userBillSchema);
module.exports = userBill;
