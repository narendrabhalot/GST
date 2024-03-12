const mongoose = require('mongoose');
const reconcilisionSchema = new mongoose.Schema({
    userGSTIN: {
        type: String,

        trim: true,
    },
    b2bInvoiceNo: {
        type: String,

        trim: true,
    },
    b2bInvoiceDate: {
        type: String,

        trim: true,
    },
    b2bPurchaserGSTIN: {
        type: String,

        trim: true,
    },
    b2bIGrandTotal: {
        type: String,

        trim: true,
    },
    b2bCess: {
        type: Number,
        default: 0
    },
    b2bSGST: {
        type: Number,
        trim: true,
        default: 0
    },
    b2bCGST: {
        type: Number,
        trim: true,
        default: 0,
    },
    b2bIGST: {
        type: Number,
        trim: true,
        default: 0,
    },
    invoiceNo: {
        type: String,

        trim: true,
    },
    invoiceDate: {
        type: String,

        trim: true,
    },
    purchaserGSTIN: {
        type: String,

        trim: true,
    },
    grandTotal: {
        type: String,

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
    status: {
        type: String,
        trim: true,
        required: true
    }
}, { "timestamps": true });
const reconcilision = mongoose.model('reconcilision', reconcilisionSchema);
module.exports = reconcilision;
