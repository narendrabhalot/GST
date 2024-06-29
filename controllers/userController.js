const { restart } = require('nodemon');
const planModel = require('../models/planModel');
const userModel = require('../models/userModel');
const { userValidation, isValidObjectId } = require('../util/validate')
const moment = require('moment')
const createUser = async (req, res) => {
    const value = await userValidation(req.body)

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
    console.log(req.user.gstin)
    if (req.user.gstin != userGSTIN) {
        return res.status(403).send({ status: false, msg: "Unauthorized user" })
    }
    const { planName, tabs, subPlanName, price } = req.body;  // Assuming req.body contains the new value for 'isPlan'
    if (!planName || !tabs || !subPlanName || !price) {
        return res.send({ status: false, msg: "planName or tabs or subPlanName or price  reuired" })
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
            subPlanName: subPlanName,
            price: price,
            tabs: tabs
        }
        user.isPlan = obj
        await user.save();
        return res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error in updateUser:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getUser = async (req, res) => {
    try {
        const user = await userModel.find().select({ otp: 0, createdAt: 0, updatedAt: 0 })
        if (user.length <= 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).send({ status: true, msg: "User get successfully", data: user })
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { businessName, schemeType, gstin, address, mobileNumber, gstPortalUserName, filingPeriod, isPlan, otp, itcRemaining, ...rest } = req.body

        if (Object.keys(rest).length > 0) {
            return res.status(400).send({ status: false, message: `Unexpected properties found in request body like ${Object.keys(rest)} ` })
        }
        if (Object.keys(req.body).length <= 0) {
            return res.status(400).send({ status: false, msg: "upadte field required in body parameter" })
        }
        if (!isValidObjectId(userId)) {
            console.log('Invalid userInfoId format');
            return res.status(400).send({ status: false, msg: "Invalid UserInfo id" });
        }
        const gstinRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
        const mobile = /^\+91[0-9]{10}$/
        if (gstin && !gstinRegex.test(gstin)) {
            return res.status(400).send({ status: false, msg: 'Invalid GSTIN' })
        }
        if (mobileNumber && !mobile.test(mobileNumber)) {
            return res.status(400).send({ status: false, msg: 'Invalid mobileNumber format. Please ensure it follows the +91XXXXXXXXXX format' })
        }
        if (mobileNumber) {
            let checkMobileNoExist = await userModel.findOne({ mobileNumber })
            if (checkMobileNoExist) {
                return res.status(400).send({ status: false, msg: 'this mobileNo. is already exist ' })
            }
        }
        const updateUser = await userModel.findByIdAndUpdate(userId, req.body, { new: true, insert: true });
        if (!updateUser) {
            console.log(`User not found with id: ${userId}`);
            return res.status(404).send({ status: false, msg: `User not found with id: ${userId}` });
        }
        console.log(updateUser)
        res.status(200).send({ status: true, msg: "User update successfully" });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send({ status: false, msg: "Error updating user", error: error.message }); // Inform client of a general error
    }
}

module.exports = { createUser, updateUserPlanByGSTIN, getUser, updateUser }