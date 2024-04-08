const subPlanModel = require('../models/subPlanModel')
const { subPlanValidation, isValidObjectId } = require('../util/validate')
const createSubPlan = async (req, res) => {

    try {
        const value = await subPlanValidation(req.body)
        const { planId } = req.body
        console.log(value)
        if (value.error) {
            return res.status(400).send({
                status: false,
                msg: value.error.message
            })
        }
      
        const plans = await subPlanModel.create(req.body)
        return res.status(201).send({
            status: true,
            msg: 'Plan  create  successfully!',
            data: plans
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering user!',
            error: error.message
        });
    }
};
const getsubPlanPlanById = async (req, res) => {
    try {

        const id = req.params.id;

        // Validate the ID format (optional, but recommended for robustness)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ status: false, msg: 'Invalid plan ID format' });
        }

        // Fetch the plan using findById and populate subplans
        const plan = await subPlanModel.find()


        if (!plan) {
            return res.status(404).send({ status: false, msg: 'Plan not found' });
        }

        // Return the populated plan data
        return res.status(200).send({ status: true, data: plan });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ status: false, msg: 'Internal server error' });
    }
};

module.exports = { createSubPlan }