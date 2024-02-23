const { string } = require("joi");
const { default: mongoose } = require("mongoose");

const createLoanSchema = new mongoose.Schema({
    gstinNo: {
        type: String,
        required: true
    },
    mobileNo: {
        type: String,
        required: true,
    },
    loanType: {
        type: String,
        required: true,
        enum: ["Home loan", "Business loan", "Vehicle loan", "Loan against Insurance", "Working Capital loan", "Personal Loan", "Short term business loan", "Education Loan", "Credit Cards"]
    }
}, { timestamps: true })
module.exports = mongoose.model('loan', createLoanSchema)