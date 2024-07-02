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
    const { gstin, userType } = req.query
    if (!gstin || !userType) {
        return res.status(400).send({ status: false, error: ' GSTIN and User type required in query parameters ' });
    }
    try {
        if (!isValidUserType(userType)) {
            return res.status(400).send({ status: false, error: 'User type must be seller or purchaser' });
        }
        const getUser = await userModel.findOne({ gstin });
        if (!getUser) {
            return res.status(404).send({ status: false, msg: "Unregistered GSTIN number." });
        }
        const userPlanType = getUser.filingPeriod;
        const { startDate, endDate } = getDatesByPlanType(userPlanType, moment().month());

        const formattedStartDate = moment(startDate, "DD/MM/YYYY").toDate(); // Convert to Date object
        const formattedendDate = moment(endDate, "DD/MM/YYYY").toDate(); // Convert to Date object
        console.log(formattedStartDate)
        const billModel = userType === 'seller' ? sellerBillModel : purchaserBillModel;
        const billData = await billModel.find({ userGSTIN: gstin, createdAt: { $gte: formattedStartDate, $lte: formattedendDate } });
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
    let getBill = billType === 'seller' ? await sellerBillModel.findById(billId) : await purchaserBillModel.findById(billId)

    if (!getBill) {
        return res.status(404).send({ status: false, msg: "No bill available with this id  " });
    }
    if (req.user.gstin != getBill.userGSTIN)
        console.log(getBill)
    let SGST, CGST, IGST
    // 4. Combine validation with database check for efficiency
    if (billType == 'seller' && getBill?.sellerType == 'cashSale') {
        SGST = CGST = (Number(grandTotal) - Number(totalAmount)) / 2
    } else {
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
        const getStateOfUser = getBill.userGSTIN.slice(0, 2);
        const getStateOfCounterparty = billType === 'seller' ? sellerGSTIN.slice(0, 2) : purchaserGSTIN.slice(0, 2);
        SGST = CGST = getStateOfUser === getStateOfCounterparty ? (Number(grandTotal) - Number(totalAmount)) / 2 : 0;
        IGST = getStateOfUser !== getStateOfCounterparty ? (Number(grandTotal) - Number(totalAmount)) : 0;
    }

    req.body.invoiceDate = formattedDate;
    req.body.SGST = SGST
    req.body.CGST = CGST;
    req.body.IGST = IGST;

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

            let quarterName = `${moment(sd).format('DD')}${moment(sd).format('MMMM')}-${moment(ed).format('DD')}${moment(ed).format('MMMM')}`
            // if (filingDataOfUser.length <= 0) {
            //     return `${quarterName}: No filling history available`;
            // }

            const obj = {
                _id: filingDataOfUser?.[0]?._id || 0,
                monthrange: quarterName,
                netSale: filingDataOfUser?.[0]?.netSale || 0,
                sumToBePaidToGovtITCUsed: filingDataOfUser?.[0]?.sumToBePaidToGovtITCUsed || 0,
                itcRemainning: filingDataOfUser?.[0]?.itcRemainning || 0,
            };
            if (filingDataOfUser[0]?.itcRemainning && filingDataOfUser[0].itcRemainning < 0) {
                obj['itcRemainning'] = 0
                obj.paidViaChalan = filingDataOfUser[0].itcRemainning
            }
            return obj;
        };
        function getFinancialYearDates(currentDate) {
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth(); // 0 (January) to 11 (December)
            // Check if current month is before April (financial year starts previous year)
            const financialYearStart = new Date(currentMonth < 3 ? currentYear - 1 : currentYear, 3, 1); // April 1st
            const financialYearEnd = new Date(currentYear, currentMonth, currentDate.getDate()); // Current date
            return { financialYearStart, financialYearEnd };
        }
        // Retrieve user details from the database
        let getUserDetail = await userModel.findOne({ gstin: userGSTIN });
        if (!getUserDetail) {
            return res.status(404).send({ status: false, message: "User not found" });
        }
        let { itcRemaining, createdAt, filingPeriod } = getUserDetail
        // Determine user's plan type and calculate the start date
        let startedMonth = new Date().getMonth() !== new Date(createdAt).getMonth() ? new Date(createdAt).getMonth() : new Date().getMonth()
        // console.log(startedMonth)
        const filingData = [];
        itcRemaining = filingData.length > 0 ? filingData.pop().itcRemaining : 0;
        if (filingPeriod == 'Monthly') {

            const currentDate = new Date();
            console.log(currentDate)
            const { financialYearStart, financialYearEnd } = getFinancialYearDates(currentDate);
            let startLoopdate = new Date(financialYearStart) < createdAt ? createdAt : new Date(financialYearStart)
            console.log("startLoopdate is ", startLoopdate)
            for (let loopDate = startLoopdate; loopDate <= financialYearEnd; loopDate.setMonth(loopDate.getMonth() + 1)) {
                const loopYear = loopDate.getFullYear();
                const loopMonth = loopDate.getMonth(); // Adjust for 0-based month index
                let { startDate, endDate } = getDatesByPlanType('Monthly', loopMonth)
                // Do something with loopYear and loopMonth (e.g., process monthly data)
                console.log(`Processing year ${loopYear}, month ${loopMonth}`, startDate, endDate);
                let datas = await getFilingDataForMonth(startDate, endDate, itcRemaining, userGSTIN, startedMonth)
                filingData.push(datas)
            }
        } else {
            const currentDate = new Date();
            console.log(currentDate);
            const { financialYearStart, financialYearEnd } = getFinancialYearDates(currentDate);
            // Calculate quarter start and end dates based on current month
            const currentMonth = currentDate.getMonth(); // 0-based month index

            // let startLoopdate= new Date(financialYearStart.getFullYear(), 3, 1)
            let startLoopdate = new Date(financialYearStart) < createdAt ? createdAt : new Date(financialYearStart)
            // let startLoopdate= new Date(financialYearStart.getFullYear(), 3, 1)
            let month = startLoopdate.getMonth()
            console.log(" months is ", month)

            const quarter = Math.floor(startLoopdate.getMonth() / 3); // Calculate current quarter (0-3)
            switch (quarter) {
                case 1: // Quarter 1 (April - June)
                    startLoopdate = new Date(financialYearStart.getFullYear(), 3, 1); // April 1st
                    break;
                case 2: // Quarter 2 (July - September)
                    startLoopdate = new Date(financialYearStart.getFullYear(), 6, 1); // July 1st
                    break;
                case 3: // Quarter 3 (October - December)
                    startLoopdate = new Date(financialYearStart.getFullYear(), 9, 1); // October 1st
                    break;
                case 0: // Quarter 4 (January - March)
                    // Handle potential year change for Quarter 4
                    const nextYear = financialYearStart.getFullYear() + 1;
                    startLoopdate = new Date(nextYear, 0, 1); // January 1st of next year
                    break;
            }

            console.log("startLoopdate is ", startLoopdate);
            for (let loopDate = startLoopdate; loopDate <= financialYearEnd; loopDate.setMonth(loopDate.getMonth() + 3)) {
                const loopYear = loopDate.getFullYear();
                const loopMonth = loopDate.getMonth(); // Adjust for 0-based month index
                let { startDate, endDate } = getDatesByPlanType('Quarterly', loopMonth)
                let datas = await getFilingDataForMonth(startDate, endDate, itcRemaining, userGSTIN, startedMonth)
                filingData.push(datas)

            }
        }
        // Array to store the filing data for all months
        return res.status(200).send({ status: true, data: filingData });
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error fetching filing history:", error);
        return res.status(500).send({ status: false, message: "Internal Server Error" });
    }
};


module.exports = { getBillHistoryByUserType, getImageHistoryByUserType, updateBillHistory, getFilingHistory }