
const { required } = require("joi");
const { default: mongoose } = require("mongoose");
const compositeSchema = new mongoose.Schema({
    totel: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Composite', compositeSchema)