const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const adminSchema = new Schema({
    adminName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);

