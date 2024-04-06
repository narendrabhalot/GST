
const { default: mongoose } = require("mongoose");
const planSchema = new mongoose.Schema({
    planName: { type: String, required: true },
    subPlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubPlan' }]
});
module.exports = mongoose.model('Plan', planSchema)