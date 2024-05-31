
const { planValidation, isValidObjectId, subPlanValidation } = require('../util/validate')
const { default: mongoose } = require("mongoose");
const planModel = require('../models/planModel'); // Assuming planModel is in a separate file
const userModel = require('../models/userModel');
const moment = require('moment')
const { updateUserPlanByGSTIN, getUser } = require('../controllers/userController')

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
    try {
        // Validate the request body
        const { error } = planValidation(req.body);
        if (error) {
            return res.status(400).send({
                status: false,
                msg: error.details[0].message,
            });
        }

        // Check if a plan with the same name already exists
        const existingPlan = await planModel.findOne({ planName: req.body.planName });
        if (existingPlan) {
            return res.status(400).send({
                status: false,
                msg: 'A plan with this name already exists.',
            });
        }
        // Create the new plan
        const plan = await planModel.create(req.body);
        return res.status(201).send({
            status: true,
            msg: 'Plan created successfully!',
            data: plan,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error creating plan!',
            error: error.message,
        });
    }
};
const createSubPlan = async (req, res) => {
    try {
        // Validate the new sub-plan (assuming planValidation is defined elsewhere)

        const { error } = subPlanValidation(req.body);
        if (error) {
            return res.status(400).send({
                status: false,
                errorss: error.details.map(detail => detail.message).join(', '),
            });
        }

        // Check if subPlans exist in the request body
        // if (!req.body.subPlans) {
        //     return res.status(400).send({
        //         status: false,
        //         msg: 'Missing sub-plans in request body.',
        //     });
        // }

        // Find the existing plan by planName
        const plan = await planModel.findById(req.params.planId);
        // console.log()
        if (!plan) {
            return res.status(404).send({
                status: false,
                msg: 'Plan not found with this plan name',
            });
        }
        const subPlanIndex = plan.subPlans.findIndex(subPlan => subPlan.subPlanName == req.body.subPlanName);
        if (subPlanIndex !== -1) {
            return res.status(404).send({
                status: false,
                msg: 'Already exist sub Plan with this  sub plan name ',
            });
        }
        let obj = { ...req.body }
        plan.subPlans.push(obj);
        const updatedPlan = await plan.save();
        console.log(updatedPlan);
        res.status(200).send({
            status: true,
            msg: 'Sub-plan added successfully!',
            data: updatedPlan,
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            status: false,
            message: 'Error adding sub-plan!',
            error: error.message,
        });
    }
};
const updateSubPlan = async (req, res) => {
    try {
        const { planId, subPlanId } = req.params
        // Validate the updated sub-plan data
        const { error } = subPlanValidation(req.body);
        if (error) {
            return res.status(400).send({
                status: false,
                msg: error.details[0].message,
            });
        }
        // Find the existing plan by planName
        const plan = await planModel.findById(planId);
        if (!planId) {
            return res.status(404).send({
                status: false,
                msg: 'Plan not found with this plan name',
            });
        }
        // Find the index of the sub-plan to update
        const subPlanIndex = plan.subPlans.findIndex(subPlan => subPlan._id.toString() === subPlanId);
        if (subPlanIndex === -1) {
            return res.status(404).send({
                status: false,
                msg: 'Sub-plan not found with this id ',
            });
        }
        let updatedPlanObj = {
            planName: plan.planName,
            subPlanName: req.body.subPlanName,
            price: req.body.subPlanName,
        }
        const usersToUpdate = await userModel.find({ "isPlan.planName": plan.planName });
        const updates = usersToUpdate.map(user => {
            return {
                updateOne: {
                    filter: { _id: user._id }, // Update the specific user document
                    update: { $set: { isPlan: updatedPlanObj } } // Update entire 'isPlan' field
                }
            };
        });
        await userModel.bulkWrite(updates);

        //// update current subPlan  of user   if sub plan is same as a current updated subPlan 
        if (plan.subPlans[subPlanIndex])
            // Update the sub-plan properties
            plan.subPlans[subPlanIndex] = req.body;
        // Save the updated plan
        // let updatedPlan = await planModel.findOneAndUpdate(
        //     { planName: planName },
        //     { $set: { [`subPlans.${subPlanIndex}`]: req.body } },
        //     { new: true } // Optional: Return the updated plan
        // );
        const updatedPlan = await plan.save();
        res.status(200).send({
            status: true,
            msg: 'Sub-plan updated successfully!',
            data: updatedPlan,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error updating sub-plan!',
            error: error.message,
        });
    }
};
const getPlan = async (req, res) => {
    try {
        const getPlan = await planModel.find();
        if (getPlan.length > 0) {
            return res.status(200).send({ status: true, planData: getPlan });
        } else {
            return res.status(200).send({ status: false, msg: `No plan available` });
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
        const deletedPlan = await planModel.findByIdAndDelete(planId);
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
const getPlanById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ status: false, msg: 'Invalid plan ID format' });
        }
        const plan = await planModel.find({ _id: id }).populate("subPlans")
        if (!plan) {
            return res.status(404).send({ status: false, msg: 'Plan not found' });
        }
        return res.status(200).send({ status: true, data: plan });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};
const getPlanByGSTIN = async (req, res) => {
    let userGSTIN = req.params.gstin
    const getUser = await userModel.findOne({ gstin: userGSTIN }).lean()
    if (getUser.isPlan) {
        return res.status(200).send({ status: true, msg: getUser.is })
    }
}
const getPlanWithSubPlan = async (req, res) => {
    try {
        const plans = await planModel.find().populate('subPlans').exec();
        res.json(plans);
    } catch (error) {
        console.error('Error retrieving plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getMyPlan = async (req, res) => {
    try {
        const userGSTIN = req.params.gstin;
        const getUser = await userModel.findOne({ gstin: userGSTIN });
        if (!getUser || !getUser.isPlan) {
            return res.status(400).send({ status: false, msg: "Plan not found for this user." });
        }
        const isActive = getUser.isPlan.isActive === true;
        if (isActive) {
            const getpurchasePlanDate = getUser.isPlan.isPurchaseDate;
            const getExpireDate = await checkPlanExpiration(getpurchasePlanDate);

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
module.exports = { createPlan, deletePlan, updateSubPlan, getPlan, getPlanByGSTIN, getPlanById, getMyPlan, getPlanWithSubPlan, createSubPlan }


