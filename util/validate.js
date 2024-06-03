const Joi = require('joi');
const mongoose = require("mongoose");
const moment = require('moment');

const validTabs = ["Filling history", "Sale history", "Purchaser history", "Reconcilition", "Image Sale", "Image Purchaser", "Excel Purchase", "Excel Sale", "Mannual Sale", "Mannual Purchaser"];
const validateString = (errorMessage) => Joi.string().trim().required().messages({ 'any.required': errorMessage });
const dateValidation = Joi.string().custom((value, helpers) => {
    if (!moment(value, 'DD/MM/YYYY', true).isValid()) {
        return helpers.message('Invoice date must be in DD/MM/YYYY format and valid');
    }
    return value;
}, 'Custom date validation');
const userValidation = (data) => {
    const userSchema = Joi.object({
        businessName: validateString("BusinessName is required"),
        schemeType: Joi.string().trim().valid('Regular', 'Composition').required().messages({
            'any.only': 'Invalid scheme types. Must be Regular or Composition',
        }),
        gstin: validateString("GSTIN number is required")
            .length(15)
            .pattern(gstinRegex)
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
const gstinRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
const otpValidation = (data) => {
    const otpSchema = Joi.object({
        mobileNumber: Joi.string().trim().pattern(/^\+91[0-9]{10}$/).required().messages({
            'any.required': "mobileNumber is required",
            'string.pattern.base': "Invalid mobile number format",
        }),
        otp: Joi.string().trim().min(6).max(6).required().messages({
            'any.required': "otp is required",
            "string.min": " otp length must be less than or equal to 6 characters long",
            "string.max": " otp length must be less than or equal to 6 characters long",
        }),
    })
    return otpSchema.validate(data)
}
const sellerBillvalidation = (data) => {
    const billSchema = Joi.object({
        billType: Joi.string().valid('seller', 'purchaser').required().messages({
            'any.only': 'Invalid bill type. Must be either "seller" or "purchaser"',
            'any.required': 'Bill type is required'
        }),
        userGSTIN: Joi.string().trim().length(15).pattern(gstinRegex).required().optional().messages({
            'string.pattern.base': "Invalid User GSTIN format",
            'any.required': "User GSTIN number is required",
            'string.length': "User GSTIN length must be 15 characters long",
        }),
        invoiceNo: Joi.string().trim().optional().allow(''),
        invoiceDate: dateValidation.required().messages({
            'any.required': "Invoice date is required",
            'string.custom': "Invoice date must be in DD/MM/YYYY format and valid",
        }),

        sellerName: Joi.string().trim().required().messages({
            'any.required': 'Seller name is required'
        }),
        totalAmount: Joi.string().trim().required().messages({
            'any.required': "Total amount is required",
        }),
        gstRate: Joi.number().valid(0, 5, 12, 18, 28).optional().messages({
            'number.base': 'Invalid GST rate. Must be a number',
            'any.only': 'Invalid GST rate. Must be 0, 5, 12, 18, 28',
        }),
        grandTotal: Joi.string().trim().required().messages({
            'any.required': "Grand Total is required",
        }),
        Cess: Joi.string()
            .trim()
            .optional()
            .allow('')
            .messages({
                'string.base': 'Invalid Cess value. Must be a string',
            }),
        sellerType: Joi.string()
            .trim()
            .optional()
            .valid("cashSale", "gstSale")
            .messages({
                'any.only': 'Invalid seller type. Must be either cashSale or gstSale',
                'string.base': 'Invalid Cess value. Must be a string',
            }),
        sellerGSTIN: Joi.when('sellerType', {
            is: 'gstSale',
            then: Joi.string().trim().length(15).pattern(gstinRegex).required().messages({ // Make sellerGSTIN required if sellerType is "gstSale"
                'string.pattern.base': "Invalid Seller GSTIN format",
                'string.length': "Seller GSTIN length must be 15 characters long",
                'any.required': "Seller GSTIN is required when sellerType is 'gstSale'",
            }),
            otherwise: Joi.string().trim().length(15).pattern(gstinRegex).optional().messages({ // Allow sellerGSTIN to be optional for other sellerTypes
                'string.pattern.base': "Invalid Seller GSTIN format",
                'string.length': "Seller GSTIN length must be 15 characters long",
            }),
        }),
    });
    return billSchema.validate(data);
};
const purchaserBillvalidation = (data) => {
    const billSchema = Joi.object({
        billType: Joi.string().valid('seller', 'purchaser').required().messages({
            'any.only': 'Invalid bill type. Must be either seller or purchaser',
            'any.required': 'Bill type is required'
        }),
        userGSTIN: Joi.string().trim().length(15).pattern(gstinRegex).required().messages({
            'string.pattern.base': "Invalid User GSTIN format",
            'any.required': "User GSTIN number is required",
            'string.length': "User GSTIN length must be 15 characters long",
        }),
        invoiceNo: Joi.string().trim().optional(),
        invoiceDate: dateValidation.required().messages({
            'any.required': "Invoice date is required",
            'string.custom': "Invoice date must be in DD/MM/YYYY format and valid",
        }),
        purchaserGSTIN: Joi.string().trim().length(15).pattern(gstinRegex).required().messages({
            'string.pattern.base': "Invalid Purchaser GSTIN format",
            'any.required': "Purchaser GSTIN number is required",
            'string.length': "Purchaser GSTIN length must be 15 characters long",
        }),

        purchaserName: Joi.string().trim().required().messages({
            'any.required': 'Purchaser name is required'
        }),
        totalAmount: Joi.string().trim().required().messages({
            'any.required': "Total amount is required",
        }),
        gstRate: Joi.number().valid(0, 5, 12, 18, 28).optional().messages({
            'number.base': 'Invalid GST rate. Must be a number',
            'any.only': 'Invalid GST rate. Must be 0, 5, 12, 18, 28',
        }),
        grandTotal: Joi.string().trim().required().messages({
            'any.required': "Grand Total is required",
        }),
        Cess: Joi.string()
            .trim()
            .optional()
            .allow('')
            .messages({
                'string.base': 'Invalid Cess value. Must be a string',
            })

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
        tabs: Joi.array().items(Joi.string().trim().valid(...validTabs).messages({
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

module.exports = { userValidation, logInValidation, planValidation, otpValidation, subPlanValidation, sellerBillvalidation, purchaserBillvalidation, loanValidation, isValidObjectId, isValidRequestBody, isValid, isValidUserType }