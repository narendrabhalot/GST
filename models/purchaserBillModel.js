const mongoose = require('mongoose');
const purchaserBillSchema = new mongoose.Schema({
    userGSTIN: {
        type: String,
        required: true,
        trim: true,
    },
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
    purchaserGSTIN: {
        type: String,
        required: true,
        trim: true,
    },
    purchaserName: {
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
    Cess: {
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
module.exports = mongoose.model('purchaserBill', purchaserBillSchema);

