
const jwt = require('jsonwebtoken')
const adminModel = require('../models/adminModel')
const creatAdmin = async (req, res) => {
    try {
        const { adminName, email, password } = req.body;
        if (!adminName || !email || !password) {
            return res.status(401).send({ status: false, msg: "Admin name or  email id  or password required" });
        }
        const admin = await adminModel.create(req.body);
        res.status(201).json({ message: 'Admin registered successfully', admin });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ error: 'An error occurred during admin registration' });
    }
}
const adminLogin = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            return res.status(401).send({ status: false, msg: "Email id  or password required" });
        }
        const admin = await adminModel.findOne({ email: emailId, password }).exec();
        if (!admin) {
            return res.status(401).send({ status: false, msg: "Incorrect emailId or password" });
        }
        const token = jwt.sign({ adminId: admin._id.toString() }, 'GST');
        return res.status(201).send({
            status: true,
            msg: 'admin  login  successfully!',
            token: token,
            data: admin,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ status: false, msg: "Error logging in" });
    }
};

module.exports = { creatAdmin, adminLogin }