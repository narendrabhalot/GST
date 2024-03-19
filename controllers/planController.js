
const { planValidation, isValidObjectId } = require('../util/validate')
const planModel = require('../models/planModel');
const userModel = require('../models/userModel');


const createPlan = async (req, res) => {
    const value = await planValidation(req.body)
    console.log(value)
    if (value.error) {
        return res.status(400).send({
            status: false,
            msg: value.error.message
        })
    }
    try {
        const plan = await planModel.create(req.body)
        return res.status(201).send({
            status: true,
            msg: 'Plan  create  successfully!',
            data: plan
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering user!',
            error: error.message
        });
    }
};

const getPlan = async (req, res) => {


    try {
        const getPlan = await planModel.find();
        if (getPlan.length > 0) {
            return res.status(200).send({ status: true, planData: getPlan });
        } else {
            return res.status(200).send({ status: fals, msg: `No plan available` });
        }

    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error geting  plan!',
            error: error.message
        });
    }
};
const deletePlan = async (req, res) => {
    let planId = req.params.id;
    if (!isValidObjectId(planId)) {
        return res.status(404).send({ status: false, msg: "valid plan id required" });
    }
    try {
        const deletedPlan = await planModel.findOneAndDelete({ _id: planId });
        if (!deletedPlan) {
            return res.status(404).send({ status: false, msg: `No plan exists with that ${planId}  ID` });
        }
        return res.status(200).send({ status: true, msg: 'Plan deleted successfully!' });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error deleting plan!',
            error: error.message
        });
    }
};

const getPlanByGSTIN = async (req, res) => {
    let userGSTIN = req.params.gstin
    const getUser = await userModel.findOne({ gstin: userGSTIN })
    if (getUser?.isPlan) {
        return res.status(200).send({ status: true, msg: getUser.is })
    }

}
module.exports = { createPlan, deletePlan, getPlan, getPlanByGSTIN }


