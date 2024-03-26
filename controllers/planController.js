
const { planValidation, isValidObjectId } = require('../util/validate')
const planModel = require('../models/planModel');
const userModel = require('../models/userModel');
const moment = require('moment')


function checkPlanExpiration(purchaseDate) {
    const expiryDates = [
        moment().set({ 'month': 0, 'date': 1 }),
        moment().set({ 'month': 3, 'date': 1 }),
        moment().set({ 'month': 6, 'date': 1 }),
        moment().set({ 'month': 9, 'date': 1 }),
    ];

    const purchaseDateMoment = moment(purchaseDate, 'DD/MM/YYYY').format('YYYY-MM-DD')
    const nextExpiryDate = expiryDates.find(expiryDate => expiryDate.isAfter(purchaseDateMoment));
    return moment(nextExpiryDate).format('DD/MM/YYYY')
}
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
    const getUser = await userModel.findOne({ gstin: userGSTIN }).lean()
    if (getUser.isPlan) {
        return res.status(200).send({ status: true, msg: getUser.is })
    }
}
const getMyPlan = async (req, res) => {
    try {
        let userGSTIN = req.params.gstin;
        const getUser = await userModel.findOne({ gstin: userGSTIN })

        // Check if user exists and has an isPlan object
        if (!getUser || !getUser.isPlan) {
            return res.status(400).send({ status: false, msg: "Plan not found for this user." });
        }

        const isActive = getUser.isPlan.isActive === true; // Non-strict comparison

        if (isActive) {
            let getpurchasePlanDate = getUser.isPlan.isPurchaseDate;
            let getExpireDate = checkPlanExpiration(getpurchasePlanDate); // Assuming checkPlanExpiration is defined
            console.log(getExpireDate);
            if (getExpireDate === moment().format('DD/MM/YYYY')) {
                await userModel.findOneAndUpdate(
                    { gstin: userGSTIN },
                    { $set: { "isPlan.isActive": false } }
                );
                return res.status(400).send({ status: false, msg: "Plan has expireddsgf." });
            } else {
                console.log('Plan is still active');
                return res.json({ status: true, msg: "Plan is active." }); // Assuming desired success response
            }
        } else {
            return res.status(400).send({ status: false, msg: "Plan is not active." });
        }
    } catch (error) {
        console.error('Error getting or updating plan:', error);
        return res.status(500).send({ status: false, msg: "Internal server error." });
    }
};

module.exports = { createPlan, deletePlan, getPlan, getPlanByGSTIN, getMyPlan }


