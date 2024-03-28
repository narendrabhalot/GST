
const { planValidation, isValidObjectId } = require('../util/validate')
const planModel = require('../models/planModel');
const userModel = require('../models/userModel');
const moment = require('moment')

function checkPlanExpiration(purchaseDate) {



    try {
        const purchaseDateMoment = moment(purchaseDate, 'DD/MM/YYYY');
        console.log(purchaseDateMoment)
        const expiryDates = [
            moment().set({ 'month': 0, 'date': 1 }),
            moment().set({ 'month': 3, 'date': 1 }),
            moment().set({ 'month': 6, 'date': 1 }),
            moment().set({ 'month': 9, 'date': 1 }),
        ];
        const nextExpiryDate = expiryDates.find(date => date.isAfter(purchaseDateMoment));
        console.log(nextExpiryDate)
        if (!nextExpiryDate) {
            return null;
        }


        return nextExpiryDate.format('DD/MM/YYYY');
    } catch (error) {
        console.error('Error checking plan expiration:', error);
        throw error;
    }
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
    const planId = req.params.id;
    if (!isValidObjectId(planId)) {
        return res.status(404).send({ status: false, msg: "Valid plan ID required." });
    }

    try {
        const deletedPlan = await planModel.findOneAndDelete({ _id: planId });
        if (!deletedPlan) {
            return res.status(404).send({ status: false, msg: `No plan found with ID: ${planId}` });
        }


        return res.status(200).send({ status: true, msg: 'Plan deleted successfully!' });
    } catch (error) {
        return res.status(500).json({
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
        const userGSTIN = req.params.gstin;



        const getUser = await userModel.findOne({ gstin: userGSTIN });

        // Check if user exists and has an isPlan object
        if (!getUser || !getUser.isPlan) {
            return res.status(400).send({ status: false, msg: "Plan not found for this user." });
        }
        const isActive = getUser.isPlan.isActive === true;
        if (isActive) {
            const getpurchasePlanDate = getUser.isPlan.isPurchaseDate;
            const getExpireDate = await checkPlanExpiration(getpurchasePlanDate);
            console.log(typeof getExpireDate);

            if (getExpireDate === moment().format('DD/MM/YYYY')) {
                await userModel.findOneAndUpdate(
                    { gstin: userGSTIN },
                    { $set: { "isPlan.isActive": false } }
                );
                return res.status(400).send({ status: false, msg: "Plan has expired." });
            } else {
                console.log('Plan is still active');
                return res.json({ status: true, msg: "Plan is active.", plan: getUser.isPlan });
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


