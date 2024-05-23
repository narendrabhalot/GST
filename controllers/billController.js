const userModel = require('../models/userModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const moment = require('moment')
const { sellerBillvalidation, purchaserBillvalidation, isValidRequestBody } = require("../util/validate")
const createUserBill = async (req, res) => {
    try {
        let { invoiceNo, invoiceDate, sellerGSTIN, purchaserGSTIN, sellerName, purchaserName, totalAmount, gstRate, grandTotal, billType, Cess } = req.body;
        const userGSTIN = req.params.gstin;
        let billValidationSchema = billType == 'seller' ? sellerBillvalidation : purchaserBillvalidation;

        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters", data: null });
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

        if (billType == "seller") {
            const mappingData = await sellerBillModel.find({userGSTIN});
            const existingInvoiceMap = new Map();
            const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");

            mappingData.forEach(invoice => {
                const formattedInvoiceDate = moment(invoice.invoiceDate).format("YYYY-MM-DD");
                const key = `${invoice.sellerGSTIN.trim().toLowerCase()}-${invoice.invoiceNo.trim().toLowerCase()}-${formattedInvoiceDate}`;
                existingInvoiceMap.set(key, invoice);
            });

            const newInvoiceKey = `${sellerGSTIN.trim().toLowerCase()}-${invoiceNo.trim().toLowerCase()}-${formattedDate}`;
            if (existingInvoiceMap.has(newInvoiceKey)) {
                return res.status(400).send({
                    status: false,
                    msg: "The combination of invoiceNo, invoiceDate, and GSTIN is already existing."
                });
            }

            const getStateOfSeller = sellerGSTIN.slice(0, 2);
            if (getStateOfSeller === getStateOfUser) {
                SGST = CGST = gstRate / 2;
            } else {
                IGST = gstRate;
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
                Cess
            };

            const userBill = new sellerBillModel(sellerBillData);
            await userBill.save();
            return res.status(201).send({ status: true, msg: "Bill uploded successfully", data: userBill });
        } else {
            const mappingData = await purchaserBillModel.find({userGSTIN});
            const existingInvoiceMap = new Map();
            const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");

            mappingData.forEach(invoice => {
                const formattedInvoiceDate = moment(invoice.invoiceDate).format("YYYY-MM-DD");
                const key = `${invoice.purchaserGSTIN.trim().toLowerCase()}-${invoice.invoiceNo.trim().toLowerCase()}-${formattedInvoiceDate}`;
                existingInvoiceMap.set(key, invoice);
            });

            const newInvoiceKey = `${purchaserGSTIN.trim().toLowerCase()}-${invoiceNo.trim().toLowerCase()}-${formattedDate}`;
            if (existingInvoiceMap.has(newInvoiceKey)) {
                return res.status(400).send({
                    status: false,
                    msg: "The combination of invoiceNo, invoiceDate, and GSTIN is already existing."
                });
            }

            const getStateOfPurchaser = purchaserGSTIN.slice(0, 2);
            if (getStateOfPurchaser === getStateOfUser) {
                SGST = gstRate / 2;
                CGST = gstRate / 2;
            } else {
                IGST = gstRate;
            }

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

module.exports = createUserBill;

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