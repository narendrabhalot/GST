const userModel = require('../models/userModel');
const { userValidation } = require('../util/validate')
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
      return  res.status(201).send({
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
module.exports = { createUser }