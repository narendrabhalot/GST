const userModel = require('../models/userModel')
const sellerBillModel = require('../models/sellerBillModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const { billValidation, isValidRequestBody } = require("../util/validate")
const createUserBill = async (req, res) => {
    let { invoiceNo, invoiceDate, sellerGSTIN, purchaserGSTIN, sellerName, purchaserName, totalAmount, gstRate, grandTotal, billType, Cess } = req.body;
    const userGSTIN = req.params.gstin
    if (!isValidRequestBody(req.body)) {
        return res.status(400).send({ status: false, message: "Invalid request parameters", data: null });
    }
    req.body.userGSTIN = userGSTIN
    const billValidationResult = await billValidation(req.body);
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
    let getUser;
    try {
        getUser = await userModel.findOne({ gstin: userGSTIN });
        if (!getUser) {
            return res.status(400).send({ status: false, message: "gstin number is not register" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: "Error fetching seller", error: error.message });
    }
    let SGST, CGST, IGST
    const getStateOfUser = userGSTIN.slice(0, 2);
    if (billType == "seller") {
        const getStateOfSeller = sellerGSTIN.slice(0, 2);
        if (getStateOfSeller === getStateOfUser) {
            SGST = CGST = gstRate / 2;
        } else {
            IGST = gstRate;
        }
        const sellerBillData = {
            userGSTIN,
            invoiceNo,
            invoiceDate,
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
        try {
            const userBill = new sellerBillModel(sellerBillData);
            await userBill.save();
            return res.status(201).send({ status: true, msg: "Seller bill registered successfully", data: userBill });
        } catch (error) {
            return res.status(500).json({ status: false, message: "Error registering seller bill", error: error.message });
        }
    } else {
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
            invoiceDate,
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
        try {
            const purchaserBill = new purchaserBillModel(purchaserBillData);
            await purchaserBill.save();
            return res.status(201).send({ status: true, msg: "purchaser  bill registered successfully", data: purchaserBill });
        } catch (error) {
            return res.status(500).json({ status: false, message: "Error registering purchaser bill", error: error.message });
        }
    }

};
module.exports = { createUserBill }