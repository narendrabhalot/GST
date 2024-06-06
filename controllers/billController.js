const userModel = require('../models/userModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const { checkInvoiceExistence } = require('../util/utils');
const moment = require('moment')
const { sellerBillvalidation, purchaserBillvalidation, isValidRequestBody } = require("../util/validate")
const createUserBill = async (req, res) => {
    try {
        let { invoiceNo, invoiceDate, sellerGSTIN, purchaserGSTIN, sellerName, purchaserName, totalAmount, gstRate, grandTotal, billType, Cess } = req.body;
        const userGSTIN = req.params.gstin;
        let billValidationSchema = billType == 'seller' ? sellerBillvalidation : purchaserBillvalidation;
        const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");
        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters", data: null });
        }
        if (billType == 'seller') {
            if (!req.query.sellerType) {
                return res.status(400).send({ status: false, message: "Seller type required in query parameter  " });
            }
            req.body.sellerType = req.query.sellerType;

        }
        req.body.userGSTIN = userGSTIN;
        const billValidationResult = await billValidationSchema(req.body);
        if (billValidationResult.error) {
            return res.status(400).send({ status: false, msg: billValidationResult.error.message });
        }
        if (!gstRate) {
            const calculatedGSTRate = ((Number(grandTotal) / Number(totalAmount)) - 1) * 100;
            gstRate = calculatedGSTRate.toFixed(2);
            const requiredGSTRates = new Set([0, 5, 12, 18, 28].map(rate => rate.toFixed(2)));
            if (!requiredGSTRates.has(gstRate)) {
                return res.status(400).send({ status: false, msg: "Grand total amount is incorrect" });
            }
        } else {
            const validGrandAmount = Number(totalAmount) + (totalAmount * (gstRate / 100));
            if (validGrandAmount !== Number(grandTotal)) {
                return res.status(400).send({ status: false, msg: "Incorrect grand amount" });
            }
        }
        let SGST, CGST, IGST;
        const getStateOfUser = userGSTIN.slice(0, 2);
        let checkduplicateData;
        if (billType == "seller") {
            if (req.query.sellerType == 'gstSale') {
                checkduplicateData = await checkInvoiceExistence(sellerBillModel, userGSTIN, invoiceDate, invoiceNo, sellerGSTIN, 'sellerGSTIN');
                if (checkduplicateData && !checkduplicateData.status) {
                    return res.status(checkduplicateData.code).send({
                        status: false,
                        msg: checkduplicateData.msg,
                        data: checkduplicateData.data
                    });
                }
                const getStateOfSeller = sellerGSTIN.slice(0, 2);
                CGST = SGST = getStateOfSeller === getStateOfUser ? (Number(grandTotal) - Number(totalAmount)) / 2 : 0;
                IGST = getStateOfSeller !== getStateOfUser ? Number(grandTotal) - Number(totalAmount) : 0
            } else {
                CGST = SGST = (Number(grandTotal) - Number(totalAmount)) / 2
            }
            const sellerBillData = {
                userGSTIN,
                invoiceNo,
                invoiceDate: formattedDate,
                sellerGSTIN,
                sellerName,
                totalAmount,
                gstRate,
                grandTotal,
                SGST,
                CGST,
                IGST,
                Cess,
                sellerType: req.query.sellerType
            };
            const userBill = new sellerBillModel(sellerBillData);
            await userBill.save();
            return res.status(201).send({ status: true, msg: "Bill uploded successfully", data: userBill });

        } else {
            checkduplicateData = await checkInvoiceExistence(purchaserBillModel, userGSTIN, invoiceDate, invoiceNo, purchaserGSTIN, 'purchaserGSTIN');
            if (checkduplicateData && !checkduplicateData.status) {
                return res.status(checkduplicateData.code).send({
                    status: false,
                    msg: checkduplicateData.msg,
                    data: checkduplicateData.data
                });
            }
            const getStateOfPurchaser = purchaserGSTIN.slice(0, 2);
            CGST = SGST = getStateOfPurchaser === getStateOfUser ? (Number(grandTotal) - Number(totalAmount)) / 2 : 0;
            IGST = getStateOfPurchaser !== getStateOfUser ? Number(grandTotal) - Number(totalAmount) : 0
            const purchaserBillData = {
                userGSTIN,
                invoiceNo,
                invoiceDate: formattedDate,
                purchaserGSTIN,
                purchaserName,
                totalAmount,
                gstRate,
                grandTotal,
                SGST,
                CGST,
                IGST,
                Cess
            };
            const purchaserBill = new purchaserBillModel(purchaserBillData);
            await purchaserBill.save();
            return res.status(201).send({ status: true, msg: " Bill uploded successfully", data: purchaserBill });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: "Error registering bill", error: error.message });
    }
};



const getBillByDateRangeAndUserGSTIN = async (req, res) => {
    try {
        const { startDate, endDate, userGSTINList } = req.body; // Destructure directly
        const billType = req.params.billType;
        if (!startDate || !endDate || !userGSTINList) {
            return res.status(400).json({ error: 'Missing required data: startDate, endDate, or userGSTINList' });
        }
        const bills = []; // Store retrieved bills

        for (const userGSTIN of userGSTINList) {
            const billModel = billType === "seller" ? sellerBillModel : purchaserBillModel;
            const formattedStartDate = startDate // Optional date validation
            const formattedEndDate = endDate   // Optional date validation

            const billData = await billModel.aggregate([
                {
                    $match: {
                        userGSTIN,
                        invoiceDate: { $gte: formattedStartDate, $lte: formattedEndDate }
                    }
                }
            ]);

            bills.push(...billData); // Efficiently append bills
        }

        res.status(200).json({ bills }); // Send retrieved bills in response
    } catch (error) {
        console.error('Error retrieving bills:', error.message);
        res.status(500).json({ error: 'Internal Server Error' }); // Handle errors gracefully
    }
};

module.exports = { createUserBill, getBillByDateRangeAndUserGSTIN }