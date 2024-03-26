
const { default: mongoose } = require("mongoose");

const createPlan = new mongoose.Schema({
    planName: {
        type: String,
        required: true
    },
    planPrice: {
        type: String,
        default: null
    },
    tabs: {
        type: Array,
        required: true
    },
    planDescription: {
        type: String,
        required: true
    },
}, { timestamps: true })
module.exports = mongoose.model('plan', createPlan)