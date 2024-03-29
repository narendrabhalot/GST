const planModel = require('../models/planModel');
const userModel = require('../models/userModel');
const { userValidation } = require('../util/validate')
const moment = require('moment')
const createUser = async (req, res) => {
    const value = await userValidation(req.body)
    // console.log(value)
    if (value.error) {
        return res.status(400).send({
            status: false,
            msg: value.error.message
        })
    }
    let getUserByMobileno = await userModel.findOne({ mobileNumber: req.body.mobileNumber })
    console.log(getUserByMobileno)
    if (getUserByMobileno) {
        return res.status(400).send({
            status: false,
            msg: " Mobile number is already registered."
        })
    }

    let checkduplicateGSTIN = await userModel.findOne({ gstin: req.body.gstin })
    console.log(checkduplicateGSTIN)
    if (checkduplicateGSTIN) {
        return res.status(400).send({
            status: false,
            msg: " gstin number is already used."
        })
    }
    let checkGSTPortalUserName = await userModel.findOne({ gstPortalUserName: req.body.gstPortalUserName })
    console.log(checkGSTPortalUserName)
    if (checkGSTPortalUserName) {
        return res.status(400).send({
            status: false,
            msg: "GST Portal UserName is already used ."
        })
    }

    try {
        const user = await userModel.create(req.body)
        return res.status(201).send({
            status: true,
            msg: 'User registered successfully!',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering user!',
            error: error.message
        });
    }
};
const updateUserPlanByGSTIN = async (req, res) => {
    const userGSTIN = req.params.gstin
    const { planName,tabs } = req.body;  // Assuming req.body contains the new value for 'isPlan'
    if (!planName || !tabs) {
        return res.send({ status: false, msg: "planName or tabs reuired" })
    }
    try {
        const user = await userModel.findOne({ gstin: userGSTIN });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let obj = {
            isActive: true,
            isPurchaseDate: moment().format('DD/MM/YYYY'),
            planData: planName,
            tabs:tabs
        }
        user.isPlan = obj
        await user.save();
        return res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error in updateUser:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { createUser, updateUserPlanByGSTIN }