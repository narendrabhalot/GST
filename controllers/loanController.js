const loanModel = require('../models/loanModel');
const userModel = require('../models/userModel')
const { loanValidation } = require('../util/validate')
const moment = require('moment')
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
    let checkduplicateGSTIN = await userModel.findOne({ gstin: req.body.gstin })

    if (checkduplicateGSTIN) {
        return res.status(400).send({
            status: false,
            msg: " gstin number is not used."
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

const getLoans = async (req, res) => {
    try {
        const loans = await loanModel.find().select({ updatedAt: 0, __v: 0 ,createdAt:0});

        if (!loans || loans.length === 0) { // Check for empty array
            return res.status(404).send({
                status: false,
                msg: "No loans found."
            });
        }
        const formattedLoans = loans.map(loan => ({
            ...loan.toObject(),
           loanDate: moment(loan.createdAt).format('YYYY-MM-DD')
        }));

        return res.status(200).send({
            status: true,
            data: formattedLoans
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send({
            status: false,
            msg: "Error retrieving loans.",
            error: err.message
        });
    }
};
module.exports = { createLoan, getLoans }