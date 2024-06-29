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
        uppercase: true,
        set: (gstin) => gstin.toUpperCase()
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
        trim: true,
        required: true,
    },
    isPlan: {
        type: Object,
        default: false

    },
    otp: {
        value: {
            type: String,
            default: null,
        },
        date: {
            type: Date,
            default: null,
        },
    },
    itcRemaining: {
        type: String,
        required: true,
        trim: true,
        default: 0
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default:"user"
    }

}, { "timestamps": true });

const Registration = mongoose.model('UserRegistration', registrationSchema);
module.exports = Registration;
