const compositeModel = require('../models/compositeModel')

const createComposite = async (req, res) => {
    try {
        const { totel } = req.body
        if (!totel) {
            return res.status(400).send({
                status: false,
                msg: 'totel required',

            });
        }
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