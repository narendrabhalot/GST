const { object } = require('joi');
const mongoose = require('mongoose');
const registrationSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
        trim: true,
    },
    schemeType: {
        type: String,
        enum: ['Regular', 'Composition'],
        required: true,
    },
    gstin: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
    },
    gstPortalUserName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    filingPeriod: {
        type: String,
        enum: ['Monthly', 'Quarterly'],
        required: true,
    },
    isPlan: {
        type: String,
        default: false

    },

}, { "timestamps": true });

const Registration = mongoose.model('UserRegistration', registrationSchema);
module.exports = Registration;
