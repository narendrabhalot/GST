const mongoose = require('mongoose');

const subPlanSchema = new mongoose.Schema({
    subPlanName: {
        type: String,
        required: true,
        trim: true
    },
    subPlanPrice: {
        type: Number,
        default: 0
    },
    tabs: {
        type: Array,
        required: true
    },
    subPlanDescription: {
        type: String,
        required: true,
        trim: true
    },
});
const planSchema = new mongoose.Schema({
    planName: { type: String, required: true },

    subPlans: [subPlanSchema],
});
module.exports = mongoose.model('Plan', planSchema);
