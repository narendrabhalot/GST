const mongoose = require('mongoose');

const subPlanSchema = new mongoose.Schema({
    subPlanName: {
        type: String,
        required: true,
        enum: ["Gold", "Platinum", "Dimond"],
        trim: true
    },
    subPlanPrice: {
        type: Number,
        default: 0
    },
    tabs: {
        type: [{
            type: String,
            enum: ["Filling history", "Sale history", "Purchaser history", "ImageSale history", "ImagePurchaser history", "Reconcilition", "Image Sale", "Image Purchaser", "Excel Purchase", "Excel Sale", "Mannual Sale", "Mannual Purchaser"]
        }],
        required: true
    },
    subPlanDescription: {
        type: String,
        required: true,
        trim: true
    },
});
const planSchema = new mongoose.Schema({
    planName: { type: String, enum: ["Image upload", "Excel upload", "Mannual bill"], required: true },
    subPlans: [subPlanSchema],
});
module.exports = mongoose.model('Plan', planSchema);
