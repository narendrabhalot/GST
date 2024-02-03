const Joi = require('joi');
const mongoose = require("mongoose");
const userValidation = (data) => {
    const userSchema = Joi.object({
        businessName: Joi.string().trim().required().messages({
            'any.required': "BusinessName is required",
        }),
        schemeType: Joi.string().trim().valid('Regular', 'Composition').required().messages({
            'any.only': 'Invalid scheme types. Must be Regular or Composition',
            'any.required': "SchemeType is required",
        }),
        gstin: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
            'string.pattern.base': "Invalid GSTIN format",
            'any.required': "GSTIN number is required",
            "string.length": "GSTIN length must be 15 characters long",
        }),
        address: Joi.string().trim().min(3).required().messages({
            "string.min": " Address must have at least 3 characters",
            'any.required': "address is required",
        }),
        mobileNumber: Joi.string().trim().pattern(/^\+91[0-9]{10}$/).required().messages({
            'any.required': "mobileNumber is required",
            'string.pattern.base': "Invalid mobile number format",
        }),
        gstPortalUserName: Joi.string().trim().required().messages({
            'any.required': "gstPortalUserName is required",
        }),
        filingPeriod: Joi.string().trim().valid('Monthly', 'Quarterly').required().messages({
            'any.only': 'Invalid scheme types. Must be Monthly or Quarterly',
            'any.required': "filingPeriod is required",
        }),
    });
    return userSchema.validate(data);
};

const logInValidation = (data) => {
    const logInSchema = Joi.object({
        mobileNumber: Joi.string().trim().pattern(/^\+91[0-9]{10}$/).required().messages({
            'any.required': "mobileNumber is required",
            'string.pattern.base': "Invalid mobile number format",
        }),
    })
    return logInSchema.validate(data)
}

const otpValidation = (data) => {
    const otpSchema = Joi.object({
        otp: Joi.string().trim().min(6).max(6).required().messages({
            'any.required': "otp is required",
            "string.min": " otp length must be less than or equal to 6 characters long",
            "string.max": " otp length must be less than or equal to 6 characters long",
        }),
    })
    return otpSchema.validate(data)
}

const userBillValidation = (data) => {
    const userSchema = Joi.object({
        invoiceNo: Joi.string().trim().required().messages({
            'any.required': "InvoiceNo is required",
        }),
        invoiceDate: Joi.string().trim().pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/).required().messages({
            'any.required': "Invoice date is required",
            'string.pattern.base': "Ibnvoive date must be DD/MM/YYYY  format",
        }),
        sellerGSTIN: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
            'string.pattern.base': "Invalid GSTIN format",
            'any.required': " Seller GSTIN number is required",
            "string.length": " Seller GSTIN length must be 15 characters long",
        }),
        totalAmount: Joi.string().trim().required().messages({
            'any.required': "Total amount is required",
        }),
        gstRate: Joi.string().trim().valid("0", "5", "12", "18", "28").required().messages({
            'any.required': "GST rate is required",
            'any.only': 'Invalid GST rate. Must be 0,5,12,18,28 ',
        }),
        grandTotal: Joi.string().trim().required().messages({
            'any.required': "GrandTotal is required",
        }),

    });
    return userSchema.validate(data);
};

// mongoose  ObjectId validation
const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId); // returns a boolean
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


module.exports = { userValidation, logInValidation, otpValidation, userBillValidation, isValidObjectId, isValidRequestBody, isValid }