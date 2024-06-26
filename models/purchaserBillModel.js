const mongoose = require('mongoose');
const moment = require('moment')
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
        type: Date, // Corrected type to Date
        required: true,
        trim: true,
    },
    purchaserGSTIN: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        set: (purchaserGSTIN) => purchaserGSTIN.toUpperCase()
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
        required: true,
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
}, { timestamps: true });

purchaserBillSchema.virtual('formattedDate').get(function () {
    return moment(this.invoiceDate).format('DD/MM/YYYY');
});

const userBill = mongoose.model('PurchaserBill', purchaserBillSchema);
module.exports = userBill;
