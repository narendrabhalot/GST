const sellerImageModel = require('../models/sellerImageModel');
const purchaserImageModel = require('../models/purchaserImageModel');

const tz = require('moment-timezone')
const moment = require('moment');

// Function to handle image upload and database storage
const uploadImage = async (req, res) => {
    const { userType, gstin } = req.params

    if (!userType || (userType !== 'seller' && userType !== "purchaser")) {
        return res.status(400).send({ status: false, msg: "Invalid user type. Must be 'seller' or 'purchaser'" });
    }

    let files = req.files
    // const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");
    try {
        if (files.length == 0) {
            return res.status(400).json({ error: 'Please select a file! ' });
        }
        for (const file of files) {
            if (userType == "seller") {
                const newImage = new sellerImageModel({
                    userGSTIN: gstin,
                    image: file.originalname,
                    path: file.path,
                });

                await newImage.save();
            } else {
                const newImage = new purchaserImageModel({
                    userGSTIN: gstin,
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
    let { startDate, endDate, userType, gstins } = req.query; // Access query parameters
    if (!startDate || !endDate || !gstins) {
        return res.status(400).send({ status: false, msg: "start date  and end date required in this DD/MM/YYYY formate " })
    }
    startDate = moment(startDate, "DD/MM/YYYY").format('YYYY-MM-DD');
    endDate = moment(endDate, "DD/MM/YYYY").endOf('day').format('YYYY-MM-DD');
    const modelName = userType == 'seller' ? sellerImageModel : purchaserImageModel
    gstins = gstins ? gstins.split(',') : [];
    if (moment(startDate).isAfter(endDate)) {
        return res.send({ status: false, msg: "Start date is greater than end date" });
    }
    try {
        const getImageByDate = await modelName.find({
            userGSTIN: { $in: gstins },
            createdAt: { $gte: startDate, $lt: moment(endDate).add(1, 'days').format('YYYY-MM-DD') },
        }).select({ image: 1, path: 1, date: 1, _id: 0 });

        if (getImageByDate.length > 0) {
            return res.status(200).send({ status: true, data: getImageByDate });
        } else {
            return res.status(404).send({ status: false, msg: "No image found with this gst no. and date range " });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
}
module.exports = { uploadImage, getImage, getImageByDateRange };
