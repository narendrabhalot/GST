const Joi = require('joi');
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
            'string.pattern.base':"Invalid GSTIN format",
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



module.exports = { userValidation, logInValidation, otpValidation }