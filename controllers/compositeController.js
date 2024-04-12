const compositeModel = require('../models/compositeModel')

const createComposite = async (req, res) => {

    try {
        const composite = await compositeModel.create(req.body)
        return res.status(201).send({
            status: true,
            msg: 'Composite data create  successfully!',
            data: composite
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering composite data !',
            error: error.message
        });
    }
};

module.exports = { createComposite }