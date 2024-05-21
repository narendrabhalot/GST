const Joi = require('joi');
const mongoose = require("mongoose");
const validTabs = ["Filling history", "Sale history", "Purchaser history", "Reconcilition", "Image Sale", "Image Purchaser", "Excel Purchase", "Excel Sale", "Mannual Sale", "Mannual Purchaser"];
const validateString = (errorMessage) => Joi.string().trim().required().messages({ 'any.required': errorMessage });
const userValidation = (data) => {
    const userSchema = Joi.object({
        businessName: validateString("BusinessName is required"),
        schemeType: Joi.string().trim().valid('Regular', 'Composition').required().messages({
            'any.only': 'Invalid scheme types. Must be Regular or Composition',
        }),
        gstin: validateString("GSTIN number is required")
            .length(15)
            .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .messages({
                'string.pattern.base': "Invalid GSTIN format",
                "string.length": "GSTIN length must be 15 characters long",
            }),
        address: validateString("Address is required").min(3).messages({
            "string.min": " Address must have at least 3 characters",
        }),
        mobileNumber: validateString("Mobile number is required").pattern(/^\+91[0-9]{10}$/).messages({
            'string.pattern.base': "Invalid mobile number format",
        }),
        gstPortalUserName: validateString("gstPortalUserName is required"),
        filingPeriod: Joi.string().trim().valid('Monthly', 'Quarterly').required().messages({
            'any.only': 'Invalid filling period. Must be Monthly or Quarterly',
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
const billValidation = (data) => {
    const billSchema = Joi.object({
        userGSTIN: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
            'string.pattern.base': "Invalid User GSTIN format",
            'any.required': " User GSTIN number is required",
            "string.length": "User GSTIN length must be 15 characters long",
        }),
        invoiceNo: Joi.string().trim().required().messages({
            'any.required': "InvoiceNo is required",
            'any.string': "invoiceNo data type required string"
        }),
        invoiceDate: Joi.string().trim().pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required().messages({
            'any.required': "Invoice date is required",
            'string.pattern.base': "Invoice date must be DD/MM/YYYY format",
        }),
        sellerGSTIN: Joi.when('billType', {
            is: 'seller',
            then: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
                'string.pattern.base': "Invalid GSTIN format",
                'any.required': "Seller GSTIN number is required",
                "string.length": "Seller GSTIN length must be 15 characters long",
            })
        }),
        purchaserGSTIN: Joi.when('billType', {
            is: 'purchaser',
            then: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
                'string.pattern.base': "Invalid GSTIN format",
                'any.required': "Purchaser GSTIN number is required",
                "string.length": "Purchaser GSTIN length must be 15 characters long",
            })
        }),
        billType: Joi.string().valid('seller', 'purchaser').required().messages({
            'any.only': 'Invalid bill type. Must be either "seller" or "purchaser"',
            'any.required': 'Bill type is required'
        }),
        sellerName: Joi.string().trim().when('billType', {
            is: 'seller',
            then: Joi.required().messages({
                'any.required': 'Seller name is required '
            })
        }),
        purchaserName: Joi.string().trim().when('billType', {
            is: 'purchaser',
            then: Joi.required().messages({
                'any.required': 'Purchaser name is required "'
            })
        }),
        totalAmount: Joi.string().trim().required().messages({
            'any.required': "Total amount is required",
        }),
        gstRate: Joi.number().valid(0, 5, 12, 18, 28).optional().messages({
            'number.base': 'Invalid GST rate. Must be a number',
            'any.only': 'Invalid GST rate. Must be 0, 5, 12, 18, 28',
        }),
        grandTotal: Joi.string().trim().required().messages({
            'any.required': "GrandTotal is required",
        }),
        billType: Joi.string().trim().valid('seller', 'purchaser').messages({
            'any.only': 'Invalid bill types. Must be seller or purchaser',
        }),
        Cess: Joi.string().optional()
    });
    return billSchema.validate(data);
};
const loanValidation = (data) => {
    const userSchema = Joi.object({
        gstinNo: Joi.string().trim().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().messages({
            'string.pattern.base': "Invalid GSTIN format",
            'any.required': "GSTIN number is required",
            "string.length": "GSTIN length must be 15 characters long",
        }),
        mobileNo: Joi.string().trim().pattern(/^\+91[0-9]{10}$/).required().messages({
            'any.required': "mobileNumber is required",
            'string.pattern.base': "Invalid mobile number format",
        }),
        loanType: Joi.string().trim().valid("Home loan", "Business loan", "Vehicle loan", "Loan against Insurance", "Working Capital loan", "Personal Loan", "Short term business loan", "Education Loan", "Credit Cards")
            .required().messages({ 'any.only': 'Invalid loan types. Must be Home loan, Business loan,  Vehicle loan, Loan against Insurance ,Working Capital loan ,Personal Loan ,Short term business loan, Education Loan, Credit Cards', 'any.required': ":Loan type  is required", }),
    });
    return userSchema.validate(data);
};
const planValidation = (data) => {

    const subPlanSchema = Joi.object({
        subPlanName: Joi.string().required().valid("Gold", "Platinum", "Dimond").messages({
            'string.base': '"subPlanName" should be a type of text',
            'any.required': '"subPlanName" is a required field',
            'any.only': 'Invalid subplan  name . Must be Gold, Platinum, Dimond',
        }),
        tabs: Joi.array().items(Joi.string().valid(...validTabs).messages({
            'any.only': `"{#value}" is not a valid tab item. Valid tabs are: ${validTabs.join(', ')}`
        })).required().messages({
            'array.base': '"tabs" must be an array',
            'any.required': '"tabs" is a required field',
            'array.includes': '"tabs" contains an invalid value'
        }),
        subPlanPrice: Joi.number().required().messages({
            'number.base': '"subPlanPrice" should be a type of number',
            'any.required': '"subPlanPrice" is a required field'
        }),
        subPlanDescription: Joi.string().required().messages({
            'string.base': '"subPlanDescription" should be a type of text',
            'any.required': '"subPlanDescription" is a required field'
        })
    });
    const planSchema = Joi.object({
        planName: Joi.string().required().messages({
            'string.base': '"planName" should be a type of text',
            'any.required': '"planName" is a required field'
        }),
        subPlans: Joi.array().items(subPlanSchema).required().messages({
            'array.base': 'subPlans must be an array',
            'any.required': '"subPlans" is a required field'
        })
    });

    return planSchema.validate(data);
};
const subPlanValidation = (data) => {
    const subPlanSchema = Joi.object({
        subPlanName: Joi.string().required().messages({
            'string.base': '"subPlanName" should be a type of text',
            'any.required': '"subPlanName" is a required field'
        }),
        tabs: Joi.array().items(Joi.string().valid(...validTabs)).required().messages({
            'array.base': '"tabs" must be an array',
            'any.required': '"tabs" is a required field',
            'array.includes': '"tabs" contains an invalid value'
        }),
        subPlanPrice: Joi.number().required().messages({
            'number.base': '"subPlanPrice" should be a type of number',
            'any.required': '"subPlanPrice" is a required field'
        }),
        subPlanDescription: Joi.string().required().messages({
            'string.base': '"subPlanDescription" should be a type of text',
            'any.required': '"subPlanDescription" is a required field'
        })
    });
    return subPlanSchema.validate(data);
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
function isValidUserType(userType) {
    const validUserTypes = ['seller', 'purchaser'];
    return validUserTypes.includes(userType);
}

module.exports = { userValidation, logInValidation, planValidation, otpValidation, subPlanValidation, billValidation, loanValidation, isValidObjectId, isValidRequestBody, isValid, isValidUserType }