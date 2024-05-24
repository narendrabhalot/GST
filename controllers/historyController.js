const sellerImageModel = require('../models/sellerImageModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserImageModel = require('../models/purchaserImageModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const { isValidUserType } = require('../util/validate')
const userModel = require('../models/userModel')
const moment = require('moment')
const momenttz = require('moment-timezone');
const { aggregate } = require('../models/planModel')

const getStartDate = (userPlan) => {
    if (userPlan == "Monthly") {
        return moment().startOf('month').toDate(); // Convert to Date object
    } else {
        const months = [0, 3, 6, 9];
        const currentMonth = moment().month();
        const nearestMonth = months.reduce((prev, curr) => curr <= currentMonth ? curr : prev);
        return moment().month(nearestMonth).startOf('month').toDate();
    }

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
    let startDate = getStartDate(userPlanType)

    const utcTime = momenttz.utc(startDate);
    const istTime = utcTime.tz('Asia/Kolkata');


    console.log(istTime)
    // startDate = moment(startDate, "DD/MM/YYYY").toDate();
    if (userType == 'seller') {
        const getSellerBillData = await sellerBillModel.find({ userGSTIN: gstin, invoiceDate: { $gt: startDate } })
        if (getSellerBillData.length > 0) {
            return res.status(200).send({ status: true, msg: "Seller bills retrieved successfully", data: getSellerBillData });
        } else {
            return res.status(404).send({ status: true, msg: "No seller bills available" });
        }
    } else {
        let getPurchaserBillData = await purchaserBillModel.find({ userGSTIN: gstin, invoiceDate: { $gt: startDate } }); // Convert startDate to Date object
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
        billData = await purchaserImageModel.find({ userGSTIN: gstin, date: { $gt: startDate } });
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
    let { userGSTIN, invoiceNo, invoiceDate, sellerGSTIN, b2bPurchaserName, purchaserGSTIN, sellerName, totalAmount, gstRate, grandTotal, totalTaxPaid, Cess, ...rest } = req.body
    if (Object.keys(rest).length > 0) {
     return res.status(400).send({status:false,message:`Unexpected properties found in request body like ${Object.keys(rest)} `})
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
const getFilingHistory = async (req, res) => {
    try {
        // Extract userGSTIN from request parameters
        let { userGSTIN } = req.params;

        // Retrieve user details from the database
        let getUserDetail = await userModel.findOne({ gstin: userGSTIN });
        let iteRemaining = 500
        if (!getUserDetail) {
            return res.status(404).send({ status: false, message: "User not found" });
        }
        // Determine user's plan type and calculate the start date
        let userPlanType = getUserDetail.filingPeriod;
        let startDate = getStartDate(userPlanType);
        startDate = moment(startDate).utc().toDate();
        console.log("Start Date:", startDate);

        // Aggregate filing data for the user
        const filingDataOfUser = await sellerBillModel.aggregate([
            {
                $match: {
                    userGSTIN,
                    invoiceDate: { $gt: startDate.toDate() }
                }
            },
            {
                $group: {
                    _id: "$userGSTIN",
                    sumOftotalAmount: { $sum: { $convert: { input: "$totalAmount", to: "double" } } },
                    sumOfSaleSGST: { $sum: { $convert: { input: "$SGST", to: "double" } } },
                    sumOfSaleIGST: { $sum: { $convert: { input: "$IGST", to: "double" } } },
                    sumOfSaleCGST: { $sum: { $convert: { input: "$CGST", to: "double" } } },
                    filingData: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 1,
                    sumOftotalAmount: 1,
                    sumOfSaleSGST: 1,
                    sumOfSaleCGST: 1,
                    sumOfSaleIGST: 1,
                    sumOfSaleOfIGST_CGST_SGSTtotalAmount: { $sum: ["$sumOfSaleSGST", "$sumOfSaleCGST", "$sumOfSaleIGST"] }
                },
                // filingData: 1,
                debugStep1: "grouped data"
            },

            {
                $lookup: {
                    from: 'b2bpurchasers',
                    localField: '_id',
                    foreignField: 'userGSTIN',
                    as: 'b2bData'
                }
            },
            {
                $project: {
                    _id: 1,
                    sumOftotalAmount: 1,

                    b2bPurchaserName: '$b2bData',
                    debugStep2: "after lookup"
                }
            },
            // {
            //     $project: {
            //         _id: 0,
            //         sumOftotalAmount: 1,
            //         b2bPurchaserName: '$b2bData',
            //         b2bPurchaserEmail: { $first: '$b2bData.totalAmount' },
            //         debugStep3: "final projection"
            //     }
            // }
        ]);
        // Check if any filing data is found
        // if (!filingDataOfUser.length) {
        //     console.log('No matching seller bills found.');
        //     return res.send({ status: true, data: { sumOftotalAmount: 0, filingData: [] } });
        // }
        console.log("Filing Data of User:", filingDataOfUser);
        // Send the filing data and sum of total amounts as response
        return res.send({ status: true, data: filingDataOfUser });

    } catch (error) {
        // Handle any unexpected errors
        console.error("Error fetching filing history:", error);
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
};



module.exports = { getBillHistoryByUserType, getImageHistoryByUserType, updateBillHistory, getFilingHistory }