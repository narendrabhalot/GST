const userModel = require('../models/userModel')
const userBillModel = require('../models/userBillModel')
const { userBillValidation, isValidObjectId, isValidRequestBody } = require("../util/validate")
const createUserBill = async (req, res) => {
    const { invoiceNo,invoiceDate, sellerGSTIN, totalAmount, gstRate, grandTotal } = req.body
    let userId, SGST, CGST, IGST;
    userId = req.params.id
    if (!isValidObjectId(userId)) {
        res
            .status(400)
            .send({ status: false, message: "invalid userId" });
        return;
    }
    if (!isValidRequestBody(req.body)) {
        res.status(400).send({ status: false, message: "Invalid request parameters", data: null });
        return;
    }
    const value = await userBillValidation(req.body)
    // console.log(value)
    if (value.error) {
        return res.status(400).send({
            status: false,
            msg: value.error.message
        })
    }
    const validGrandAmount = Number(totalAmount) + (totalAmount * (gstRate / 100))
    console.log(validGrandAmount)
    if (validGrandAmount !== Number(grandTotal)) {
        return res.status(400).send({ status: false, msg: "Incorrect grand amount " })
    }
    let getuser = await userModel.findById(userId)
    if (!getuser) {
        res.status(400).send({
            status: false,
            message: "user not found",
        });
        return;
    }
    let getStateOfSeller = sellerGSTIN.slice(0, 2)
    let getStateOfUser = getuser.gstin.slice(0, 2)
    if (getStateOfSeller == getStateOfUser) {
        SGST = gstRate / 2
        CGST = gstRate / 2
    } else {
        IGST = gstRate
    }

    try {
        const userBill = new userBillModel({
            "invoiceNo": invoiceNo,
            "sellerGSTIN": sellerGSTIN,
            "invoiceDate":invoiceDate,
            "totalAmount": totalAmount,
            "gstRate": gstRate,
            "grandTotal": grandTotal,
            "SGST": SGST,
            "CGST": CGST,
            "IGST": IGST,
        });
        await userBill.save()
        return res.status(201).send({ status: true, msg: "user bill register successfully", data: userBill })
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error registering user!',
            error: error.message
        });
    }
};
module.exports = { createUserBill }