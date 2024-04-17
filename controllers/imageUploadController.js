const sellerImageModel = require('../models/sellerImageMOdel');
const purchaserImageModel = require('../models/purchaserImageMOdel');


const moment = require('moment');

// Function to handle image upload and database storage
const uploadImage = async (req, res) => {
    const userType = req.params.userType
    if (!userType) {
        return res.status(400).send({ status: false, msg: "invalid user type.Must have a seller or purchaser" })
    }
    let files = req.files
    try {
        if (files.length == 0) {
            return res.status(400).json({ error: 'Please select a file! ' });
        }
        console.log(req.files)
        for (const file of files) {
            if (userType == "seller") {
                const newImage = new sellerImageModel({
                    image: file.originalname,
                    path: file.path,
                });

                await newImage.save();
            } else {
                const newImage = new purchaserImageModel({
                    image: file.originalname,
                    path: file.path,
                });
                await newImage.save();
            }
        }
        return res.send({ message: 'File uploaded successfully', });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const getImage = async (req, res) => {
    const images = await sellerImageModel.find()
    return res.status(200).send({ status: true, data: images })
}
const getImageByDateRange = async (req, res) => {
    let { startDate, endDate } = req.body;
    startDate = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
    endDate = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();
    if (moment(startDate).isAfter(endDate)) {
        return res.send({ status: false, msg: "Start date is greater than end date" });
    }

    try {
        const getImageByDate = await imageModel.find({ createdAt: { $gte: startDate, $lte: endDate } }).select({ image: 1, path: 1, _id: 0 })
        console.log(getImageByDate);
        res.status(200).send({ status: true, data: getImageByDate });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
module.exports = { uploadImage, getImage, getImageByDateRange };
