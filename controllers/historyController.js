const sellerImageModel = require('../models/sellerImageModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserImageModel = require('../models/purchaserImageModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const { isValidUserType } = require('../util/validate')
const userModel = require('../models/userModel')
const moment = require('moment')

const getStartDate = () => {
    const months = [0, 3, 6, 9];
    const currentMonth = moment().month();
    const nearestMonth = months.reduce((prev, curr) => curr <= currentMonth ? curr : prev);
    return moment().month(nearestMonth).startOf('month').toDate();
};
const getBillHistoryByUserType = async (req, res) => {
    const { gstin, userType } = req.params;

    if (!isValidUserType(userType)) {
        return res.status(400).send({ status: false, error: 'User type must be seller or purchaser' });
    }
    const getUser = await userModel.findOne({ gstin: gstin });
    if (!getUser) {
        return res.status(404).send({ status: false, msg: "Unregistered GSTINno." });
    }
    let userPlanType = getUser.filingPeriod;
    let startDate;
    if (userPlanType == "Monthly") {
        startDate = moment().startOf('month').toDate(); // Convert to Date object
    } else {

        startDate = getStartDate(); // Convert to Date object
    }
    // startDate = moment(startDate, "DD/MM/YYYY").toDate();
    if (userType == 'seller') {
        const getSellerBillData = await sellerBillModel.find({ userGSTIN: gstin, invoiceDate: { $gt: startDate } })
        if (getSellerBillData.length > 0) {
            return res.status(200).send({ status: true, msg: "Seller bills retrieved successfully", data: getSellerBillData });
        } else {
            return res.status(404).send({ status: true, msg: "No seller bills available" });
        }
    } else {
        let getPurchaserBillData = await purchaserBillModel.find({ userGSTIN: gstin, invoiceDate: { $gt: new Date(startDate) } }); // Convert startDate to Date object
        if (getPurchaserBillData.length > 0) {
            return res.status(400).send({ status: true, msg: "Purchaser bills retrieved successfully", data: getPurchaserBillData });
        } else {
            return res.status(400).send({ status: true, msg: "No purchaser bills available" });
        }
    }
};
const getImageHistoryByUserType = async (req, res) => {
    const { gstin, userType } = req.params;
    if (!isValidUserType(userType)) {
        return res.status(400).send({ status: false, error: 'User type must be seller or purchaser' });
    }

    const getUser = await userModel.findOne({ gstin: gstin });
    if (!getUser) {
        return res.status(404).send({ status: false, msg: "Unregistered GSTINno." });
    }
    let userPlanType = getUser.filingPeriod;
    let startDate;
    if (userPlanType == "Monthly") {
        startDate = moment().startOf('month').toDate(); // Convert to Date object
    } else {
        startDate = getStartDate();
    }

    let billData;
    if (userType == 'seller') {
        billData = await sellerImageModel.find({ userGSTIN: gstin, date: { $gt: startDate } });
    } else {
        billData = await purchaserBillModel.find({ userGSTIN: gstin, date: { $gt: startDate } });
    }

    if (billData.length > 0) {
        return res.status(200).send({ status: true, msg: `${userType} image retrieved successfully`, data: billData });
    } else {
        return res.status(404).send({ status: true, msg: `No ${userType} image available` });
    }
};


const updateBillHistory = async (req, res) => {
    const { billId, billType } = req.params;

    // Validate required fields and return appropriate error response
    if (!billId || !billType || Object.keys(req.body).length <= 0) {
        return res.status(400).send({ status: false, msg: "Missing required fields: billId or  billType or  and updated data in request body" });
    }
    const billModel = billType === 'seller' ? sellerBillModel : purchaserBillModel;
    try {
        // Combine findByIdAndUpdate with error handling for a cleaner approach
        const updatedBill = await billModel.findByIdAndUpdate(billId, { $set: req.body }, { new: true, upsert: true });
        if (!updatedBill) {
            return res.status(404).send({ status: false, msg: `Bill of type '${billType}' with ID '${billId}' not found` });
        }
        return res.status(200).send({ status: true, msg: "Data updated successfully" });
    } catch (error) {
        console.error('Error updating bill:', error); // Log the error for debugging
        return res.status(500).send({ status: false, msg: "Internal server error" });
    }
};




module.exports = { getBillHistoryByUserType, getImageHistoryByUserType, updateBillHistory }