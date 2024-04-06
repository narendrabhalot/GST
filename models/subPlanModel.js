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
}, { timestamps: true });

module.exports = mongoose.model('SubPlan', subPlanSchema);
