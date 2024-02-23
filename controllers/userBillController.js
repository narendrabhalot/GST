    const userModel = require('../models/userModel')
    const userBillModel = require('../models/userBillModel')
    const { userBillValidation, isValidObjectId, isValidRequestBody } = require("../util/validate")
const createUserBill = async (req, res) => {
    let { invoiceNo, invoiceDate, sellerGSTIN, totalAmount, gstRate, grandTotal } = req.body;
    const userId = req.params.id;

    // Validating userId
    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "Invalid userId" });
    }
    // Validating request body
    if (!isValidRequestBody(req.body)) {
        return res.status(400).send({ status: false, message: "Invalid request parameters", data: null });
    }

    // Validating user bill
    const userBillValidationResult = await userBillValidation(req.body);
    if (userBillValidationResult.error) {
        return res.status(400).send({ status: false, msg: userBillValidationResult.error.message });
    }

    // Validating GST rate and grand total
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

    // Fetching user by ID
    let getUser;
    try {
        getUser = await userModel.findById(userId);
        if (!getUser) {
            return res.status(400).send({ status: false, message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ status: false, message: "Error fetching user", error: error.message });
    }

    // Calculating GST components
    let SGST, CGST, IGST;
    const getStateOfSeller = sellerGSTIN.slice(0, 2);
    const getStateOfUser = getUser.gstin.slice(0, 2);
    if (getStateOfSeller === getStateOfUser) {
        SGST = gstRate / 2;
        CGST = gstRate / 2;
    } else {
        IGST = gstRate;
    }

    // Creating user bill
    const userBillData = {
        invoiceNo,
        sellerGSTIN,
        invoiceDate,
        totalAmount,
        gstRate,
        grandTotal,
        SGST,
        CGST,
        IGST,
    };
    try {
        const userBill = new userBillModel(userBillData);
        await userBill.save();
        return res.status(201).send({ status: true, msg: "User bill registered successfully", data: userBill });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Error registering user bill", error: error.message });
    }
};

module.exports = { createUserBill }