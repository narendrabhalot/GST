const loanModel = require('../models/loanModel');
const userModel = require('../models/userModel')
const { loanValidation } = require('../util/validate')
const createLoan = async (req, res) => {
    const value = await loanValidation(req.body)
    console.log(value)
    if (value.error) {
        return res.status(400).send({
            status: false,
            msg: value.error.message
        })
    }
    let getUserByMobileno = await userModel.findOne({ mobileNumber: req.body.mobileNo })
    if (!getUserByMobileno) {
        return res.status(400).send({
            status: false,
            msg: " Mobile number is not  registered."
        })
    }
    let checkduplicateGSTIN = await loanModel.findOne({ gstin: req.body.gstin })
    console.log(checkduplicateGSTIN)
    if (checkduplicateGSTIN) {
        return res.status(400).send({
            status: false,
            msg: " gstin number is already used."
        })
    }
    try {
        const loan = await loanModel.create(req.body)
        return res.status(201).send({
            status: true,
            msg: 'Loan registered successfully!',
            data: loan
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering user!',
            error: error.message
        });
    }
};
module.exports = { createLoan }