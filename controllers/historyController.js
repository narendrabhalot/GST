const sellerImageModel = require('../models/sellerImageModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserImageModel = require('../models/purchaserImageModel')
const purchaserBillModel = require('../models/purchaserBillModel')

const { isValidUserType } = require('../util/validate')
const userModel = require('../models/userModel')
const moment = require('moment')
// let momenttz = require('moment-timezone');
const { aggregate } = require('../models/planModel')
const getDatesByPlanType = (userPlan, month) => {
    const IST_TIMEZONE = 'Asia/Kolkata';
    let startDate, endDate;

    if (userPlan === "Monthly") {
        startDate = moment.tz(IST_TIMEZONE).month(month).startOf('month').add(5, 'hours').add(30, 'minutes');
        endDate = moment.tz(IST_TIMEZONE).month(month).endOf('month');
    } else {
        // Quarterly plan
        const quarters = [
            { start: 0, end: 2 },  // Q1: January to March
            { start: 3, end: 5 },  // Q2: April to June
            { start: 6, end: 8 },  // Q3: July to September
            { start: 9, end: 11 }  // Q4: October to December
        ];


        const quarter = quarters.find(q => month >= q.start && month <= q.end);

        startDate = moment.tz(IST_TIMEZONE).month(quarter.start).startOf('month').add(5, 'hours').add(30, 'minutes');
        endDate = moment.tz(IST_TIMEZONE).month(quarter.end).endOf('month');
    }

    return {
        startDate: startDate.toDate(),
        endDate: endDate.toDate()
    };
};
const getBillHistoryByUserType = async (req, res) => {
    const { gstin, userType } = req.params;
    try {
        if (!isValidUserType(userType)) {
            return res.status(400).send({ status: false, error: 'User type must be seller or purchaser' });
        }
        const getUser = await userModel.findOne({ gstin });
        if (!getUser) {
            return res.status(404).send({ status: false, msg: "Unregistered GSTIN number." });
        }
        const userPlanType = getUser.filingPeriod;
        const { startDate } = getDatesByPlanType(userPlanType, moment().month());

        const formattedStartDate = moment(startDate, "DD/MM/YYYY").toDate(); // Convert to Date object
        console.log(formattedStartDate)

        const billModel = userType === 'seller' ? sellerBillModel : purchaserBillModel;
        const billData = await billModel.find({ userGSTIN: gstin, invoiceDate: { $gte: formattedStartDate } });
        if (billData.length > 0) {
            return res.status(200).send({ status: true, msg: `Retrieved ${userType} bills successfully`, data: billData });
        } else {
            return res.status(404).send({ status: false, msg: `No ${userType} bills available` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: false, msg: "An error occurred", error: error.message });
    }
};

const getImageHistoryByUserType = async (req, res) => {
    const { gstin, userType } = req.params;

    try {
        if (!isValidUserType(userType)) {
            return res.status(400).send({ status: false, error: 'User type must be seller or purchaser' });
        }
        const getUser = await userModel.findOne({ gstin });
        if (!getUser) {
            return res.status(404).send({ status: false, msg: "Unregistered GSTIN number." });
        }
        const userPlanType = getUser.filingPeriod;
        const { startDate } = getDatesByPlanType(userPlanType, moment().month());
        const formattedStartDate = moment(startDate, "DD/MM/YYYY").toDate(); // Convert to Date object
        const billModel = userType === 'seller' ? sellerImageModel : purchaserImageModel;
        const imageData = await billModel.find({ userGSTIN: gstin, date: { $gte: formattedStartDate } });
        if (imageData.length > 0) {
            return res.status(200).send({ status: true, msg: `${userType} image retrieved successfully`, data: imageData });
        } else {
            return res.status(404).send({ status: false, msg: `No ${userType} image available` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: false, msg: "An error occurred", error: error.message });
    }
};

const updateBillHistory = async (req, res) => {
    // 1. Validate required fields with a single destructuring and early return for clarity
    const { billId, billType } = req.params;
    const {
        userGSTIN,
        invoiceNo,
        invoiceDate,
        sellerGSTIN,
        b2bPurchaserName,
        purchaserGSTIN,
        sellerName,
        purchaserName,
        totalAmount,
        gstRate,
        grandTotal,
        totalTaxPaid,
        Cess,
        ...rest
    } = req.body;

    if (!billId || !billType || !Object.keys(req.body).length) {
        return res.status(400).send({ status: false, msg: "Missing required fields: billId, billType, or updated data in request body" });
    }
    if (Object.keys(rest).length > 0) {
        return res.status(400).send({ status: false, message: `Unexpected properties found in request body: ${Object.keys(rest).join(', ')}` });
    }

    // 2. Validate GST rate using a Set for efficiency and early return
    const validGSTRates = new Set([5, 12, 18, 28]);
    if (!validGSTRates.has(gstRate)) {
        return res.status(400).send({ status: false, msg: "Incorrect GST rate" });
    }

    // 3. Determine bill model and calculate grand total efficiently
    const billModel = billType === 'seller' ? sellerBillModel : purchaserBillModel;
    const validGrandAmount = Number(totalAmount) + (Number(totalAmount) * (gstRate / 100));
    if (validGrandAmount !== Number(grandTotal)) {
        return res.status(400).send({ status: false, msg: "Incorrect grand amount" });
    }

    const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");
    let seller = billType === 'seller' ? await sellerBillModel.findById(billId) : null
    // 4. Combine validation with database check for efficiency
    if (billType === 'seller' && seller.sellerType == 'cashCale') {

    }
    const query = {
        invoiceNo: invoiceNo.trim(),
        invoiceDate: formattedDate,
        ...(billType === 'seller' ? { sellerGSTIN: sellerGSTIN.trim() } : { purchaserGSTIN: purchaserGSTIN.trim() }),
    };

    try {
        const existingBill = await billModel.find(query);
        if (existingBill.length > 0 && !existingBill.some(item => item._id.equals(billId))) {
            return res.status(400).send({ status: false, msg: "Combination of userBillGSTIN, invoiceDate, and invoiceNo already exists." });
        }
    } catch (error) {
        console.error('Error checking for existing bill:', error);
        return res.status(500).send({ status: false, msg: "Internal server error" });
    }

    // 5. Calculate SGST, CGST, and IGST using a ternary operator for conciseness
    const getStateOfUser = userGSTIN.slice(0, 2);
    const getStateOfCounterparty = billType === 'seller' ? sellerGSTIN.slice(0, 2) : purchaserGSTIN.slice(0, 2);
    SGST = CGST = getStateOfUser === getStateOfCounterparty ? gstRate / 2 : 0;
    IGST = getStateOfUser !== getStateOfCounterparty ? gstRate : 0;

    // 6. Update bill data and handle errors using findByIdAndUpdate with options
    req.body.invoiceDate = formattedDate;
    try {
        const updatedBill = await billModel.findByIdAndUpdate(billId, req.body, { new: true });
        if (!updatedBill) {
            return res.status(404).send({ status: false, msg: `Bill of type '${billType}' with ID '${billId}' not found` });
        }
        return res.status(200).send({ status: true, msg: "Data updated successfully" });
    } catch (error) {
        console.error('Error updating bill:', error);
        return res.status(500).send({ status: false, msg: "Internal server error" });
    }
};

// const updateBillHistory = async (req, res) => {
//     const { billId, billType } = req.params;
//     // Validate required fields and return appropriate error response
//     if (!billId || !billType || Object.keys(req.body).length <= 0) {
//         return res.status(400).send({ status: false, msg: "Missing required fields: billId or  billType or  and updated data in request body" });
//     }
//     let { userGSTIN, invoiceNo, invoiceDate, sellerGSTIN, b2bPurchaserName, purchaserGSTIN, sellerName, totalAmount, gstRate, grandTotal, totalTaxPaid, Cess, ...rest } = req.body
//     if (Object.keys(rest).length > 0) {
//         return res.status(400).send({ status: false, message: `Unexpected properties found in request body like ${Object.keys(rest)} ` })
//     }
//     const requiredGSTRates = new Set([5, 12, 18, 28]);
//     if (!requiredGSTRates.has(gstRate)) {
//         console.log("gst rate invalid")
//         return res.status(400).send({ status: false, msg: "Incorrect GST rate " });
//     }
//     const billModel = billType === 'seller' ? sellerBillModel : purchaserBillModel;
//     const validGrandAmount = Number(totalAmount) + (totalAmount * (gstRate / 100));
//     if (validGrandAmount !== Number(grandTotal)) {
//         return res.status(400).send({ status: false, msg: "Incorrect grand amount" });
//     }
//     const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");
//     const query = {
//         invoiceNo: invoiceNo.trim(),
//         invoiceDate: formattedDate,
//         sellerGSTIN: sellerGSTIN.trim()
//     };

//     let checkDataExist = await billModel.find(query);
//     if (checkDataExist) {
//         let result = await checkDataExist.every(item => item._id.equals(billId));
//         if (!result) {
//             return res.send({ status: false, msg: "Combination of userBillGSTIN, invoiceDate, and invoiceNo already exists." })
//         }
//     }
//     console.log(checkDataExist)

//     let SGST, CGST, IGST;
//     const getStateOfUser = userGSTIN.slice(0, 2);


//     const getStateOfSeller = sellerGSTIN.slice(0, 2);
//     if (getStateOfSeller === getStateOfUser) {
//         SGST = CGST = gstRate / 2;
//     } else {
//         IGST = gstRate;
//     }
//     req.body.invoiceDate = formattedDate
//     try {
//         // Combine findByIdAndUpdate with error handling for a cleaner approach
//         const updatedBill = await billModel.findByIdAndUpdate(billId, { $set: req.body }, { new: true, upsert: true });
//         if (!updatedBill) {
//             return res.status(404).send({ status: false, msg: `Bill of type '${billType}' with ID '${billId}' not found` });
//         }
//         return res.status(200).send({ status: true, msg: "Data updated successfully" });
//     } catch (error) {
//         console.error('Error updating bill:', error); // Log the error for debugging
//         return res.status(500).send({ status: false, msg: "Internal server error" });
//     }
// };
const getFilingHistory = async (req, res) => {
    try {
        const IST_TIMEZONE = 'Asia/Kolkata';
        let currentDate = moment.tz().add(5, 'hours').add(30, 'minutes').toString()

        let { userGSTIN } = req.params;
        const getFilingDataForMonth = async (sd, ed, itcRemaining, userGSTIN, startedMonth) => {
            console.log(sd, ed, itcRemaining, userGSTIN)
            const filingDataOfUser = await sellerBillModel.aggregate([
                {
                    $match: {
                        userGSTIN: userGSTIN,
                        invoiceDate: { $gte: sd, $lt: ed }
                    }
                },
                {
                    $group: {
                        _id: "$userGSTIN",
                        netSale: { $sum: { $convert: { input: "$grandTotal", to: "double" } } },
                        sumOfSaleSGST: { $sum: { $convert: { input: "$SGST", to: "double" } } },
                        sumOfSaleIGST: { $sum: { $convert: { input: "$IGST", to: "double" } } },
                        sumOfSaleCGST: { $sum: { $convert: { input: "$CGST", to: "double" } } },
                        filingData: { $push: "$$ROOT" }
                    }
                },
                {
                    $lookup: {
                        from: 'b2bpurchasers',
                        let: { user_gstin: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$userGSTIN', '$$user_gstin'] },
                                            { $gt: ['$invoiceDate', sd] },
                                            { $lt: ['$invoiceDate', ed] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'b2bData'
                    }
                },
                { $unwind: { path: "$b2bData", preserveNullAndEmptyArrays: true } }, // Unwind the b2bData array to deconstruct the array
                {
                    $group: {
                        _id: "$_id",
                        netSale: { $first: "$netSale" },
                        sumOfSaleSGST: { $first: "$sumOfSaleSGST" },
                        sumOfSaleIGST: { $first: "$sumOfSaleIGST" },
                        sumOfSaleCGST: { $first: "$sumOfSaleCGST" },
                        sumOfSaleOfIGST_CGST_SGST: { $first: "$sumOfSaleOfIGST_CGST_SGST" },
                        sumOfSaleSGSTs: {
                            $sum: {
                                $convert: {
                                    input: { $ifNull: ["$b2bData.SGST", 0] },
                                    to: "double"
                                }
                            }
                        },
                        sumOfSaleIGSTs: {
                            $sum: {
                                $convert: {
                                    input: { $ifNull: ["$b2bData.IGST", 0] },
                                    to: "double"
                                }
                            }
                        },
                        sumOfSaleCGSTs: {
                            $sum: {
                                $convert: {
                                    input: { $ifNull: ["$b2bData.CGST", 0] },
                                    to: "double"
                                }
                            }
                        },
                        b2bData: { $push: "$b2bData" }
                    }
                },
                {
                    $addFields: {
                        sumOfSaleSGSTs: { $ifNull: ["$sumOfSaleSGSTs", 0] },
                        sumOfSaleIGSTs: { $ifNull: ["$sumOfSaleIGSTs", 0] },
                        sumOfSaleCGSTs: { $ifNull: ["$sumOfSaleCGSTs", 0] },
                        sumOfB2BGST_CGST_SGST: {
                            $add: ["$sumOfSaleSGSTs", "$sumOfSaleIGSTs", "$sumOfSaleCGSTs"]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        netSale: 1,
                        sumOfSaleSGST: 1,
                        sumOfSaleCGST: 1,
                        sumOfSaleIGST: 1,
                        sumToBePaidToGovtITCUsed: { $sum: ["$sumOfSaleSGST", "$sumOfSaleCGST", "$sumOfSaleIGST"] },
                        sumOfSaleSGSTs: 1,
                        sumOfSaleIGSTs: 1,
                        sumOfSaleCGSTs: 1,
                        sumOfB2BGST_CGST_SGST: 1,
                        b2bData: 1 // Include b2bData in the output
                    }
                },
                {
                    $project: {
                        _id: 1,
                        netSale: 1,
                        // b2bPurchaserName: '$b2bData',
                        sumOfSaleSGST: 1,
                        sumOfSaleCGST: 1,
                        sumOfSaleIGST: 1,
                        sumToBePaidToGovtITCUsed: 1,
                        sumOfSaleSGSTs: 1,
                        sumOfSaleIGSTs: 1,
                        sumOfSaleCGSTs: 1,
                        sumOfB2BGST_CGST_SGST: 1,
                        itcRemainning: {
                            $subtract: [
                                {
                                    $sum: [itcRemaining, "$sumOfB2BGST_CGST_SGST"]
                                }, "$sumToBePaidToGovtITCUsed"
                            ]
                        }
                    },
                }

            ]);
            console.log(filingDataOfUser)

            // if (filingDataOfUser.length <= 0) {
            //     return "No data available"
            // }
            // Prepare and return the response object
            // let quarterName = `${moment(sd).format('MMMM')}-${moment(ed).format('MMMM')}`
            // const obj = {
            //     _id: filingDataOfUser[0]._id,
            //     month: quarterName,
            //     netSale: filingDataOfUser[0].netSale,
            //     sumToBePaidToGovtITCUsed: filingDataOfUser[0].sumToBePaidToGovtITCUsed,
            //     itcRemainning: filingDataOfUser[0].itcRemainning,
            // };
            // if (filingDataOfUser[0].itcRemainning < 0) {
            //     obj['itcRemainning'] = 0
            //     obj.paidViaChalan = filingDataOfUser[0].itcRemaining
            // }
            return filingDataOfUser;
        };
        // Retrieve user details from the database
        let getUserDetail = await userModel.findOne({ gstin: userGSTIN });
        if (!getUserDetail) {
            return res.status(404).send({ status: false, message: "User not found" });
        }
        let { itcRemaining, createdAt, filingPeriod } = getUserDetail
        let dateObj = new Date(createdAt).getMonth();
        // Determine user's plan type and calculate the start date
        let startedMonth = new Date().getMonth() !== new Date(createdAt).getMonth() ? new Date(createdAt).getMonth() : new Date().getMonth()
        console.log(startedMonth)
        const filingData = [];
        itcRemaining = filingData.length > 0 ? filingData.pop().itcRemaining : 0;
        if (filingPeriod == 'Monthly') {
            consol
            for (let i = 0; i <= new Date().getMonth(); i++) {
                let { startDate, endDate } = await getDatesByPlanType(filingPeriod, startedMonth + i);
                let result = await getFilingDataForMonth(startDate, endDate, Number(itcRemaining), userGSTIN, startedMonth + i)
                filingData.push(result)
            }
        } else {
            async function getPreviousQuarters(inputDate) {
                let date = inputDate.toString()
                console.log("date is a ", date)
                const quarters = [
                    { name: "Q1", startMonth: 3, endMonth: 5 },
                    { name: "Q2", startMonth: 6, endMonth: 8 },
                    { name: "Q3", startMonth: 9, endMonth: 11 },
                    { name: "Q4", startMonth: 0, endMonth: 2 }
                ];

                const previousQuarters = [];
                for (let i = 0; i < quarters.length; i++) {

                    const { name, startMonth, endMonth } = quarters[i];

                    // Create startDate and endDate objects with timezone and formatting
                    let startDate = moment.tz(IST_TIMEZONE).month(startMonth).startOf('month').add(5, 'hours').add(30, 'minutes').toDate().toString()
                    let endDate = moment.tz(IST_TIMEZONE).month(endMonth).endOf('month').toDate().toString()
                    console.log(date)
                    startDate = moment(startDate, "ddd MMM DD YYYY HH:mm:ss Z");
                    endDate = moment(endDate, "ddd MMM DD YYYY HH:mm:ss Z");
                    date = moment.utc(date);
                    console.log(date, startDate, endDate)

                    if (moment(date).isAfter(endDate)) { // Modified for inclusivity
                        console.log("nare")
                        if (name == "Q4") {
                            previousQuarters.push({
                                startDate: moment.tz(IST_TIMEZONE)
                                    .month(startMonth)
                                    .startOf('month')
                                    .add(5, 'hours')
                                    .add(30, 'minutes').toDate(),

                                endDate: moment.tz(IST_TIMEZONE)
                                    .month(endMonth).year(moment(date).year())
                                    .endOf('month').toDate(),
                            });
                        } else {
                            previousQuarters.push({
                                startDate: moment.tz(IST_TIMEZONE)
                                    .month(startMonth)
                                    .startOf('month')
                                    .add(5, 'hours')
                                    .add(30, 'minutes').toDate(),

                                endDate: moment.tz(IST_TIMEZONE)
                                    .month(endMonth)
                                    .endOf('month').toDate(),
                            });
                        }

                    } else {
                        previousQuarters.push({
                            startDate: moment.tz(IST_TIMEZONE)
                                .month(startMonth)
                                .startOf('month')
                                .add(5, 'hours')
                                .add(30, 'minutes').toDate(),

                            endDate: moment.tz(IST_TIMEZONE)
                                .month(endMonth).year(moment(date).year())
                                .endOf('month').toDate(),

                        });
                        break
                    }
                }
                return previousQuarters;
            }
            currentDate = new Date('2025-02-25');
            console.log("currentDate is ", currentDate)
            let datesforQuarterlyUser = await getPreviousQuarters(currentDate)
            console.log("datesforQuarterlyUser is  ", datesforQuarterlyUser)
            for (let item of datesforQuarterlyUser) {
                let { startDate, endDate } = item
                console.log(createdAt, endDate)
                console.log("nare")
                let datas = await getFilingDataForMonth(startDate, endDate, itcRemaining, userGSTIN, startedMonth)
                filingData.push(datas)
            }
        }

        // Array to store the filing data for all months




        return res.status(500).send({ status: false, data: filingData });

    } catch (error) {
        // Handle any unexpected errors
        console.error("Error fetching filing history:", error);
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
};


module.exports = { getBillHistoryByUserType, getImageHistoryByUserType, updateBillHistory, getFilingHistory }