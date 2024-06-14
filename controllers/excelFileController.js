const sellerBillModel = require('../models/sellerBillModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const userModel = require('../models/userModel');
const path = require('path');
const fs = require('fs');
const { billValidation, isValidRequestBody } = require("../util/validate");
const xlsx = require("xlsx");
async function uploadExcelFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No excel file uploaded' });
        }
        return res.status(201).json({ data: " file uploaded successfully " })
        // const workbook = xlsx.readFile(req.file.path);
        // const sheetName = workbook.SheetNames[0];
        // const worksheet = workbook.Sheets[sheetName];
        // const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });
        // const userGSTIN = req.params.id;
        // const getStateOfUser = userGSTIN.slice(0, 2);
        // const billType = req.params.billType
        // if (!isValidRequestBody(data)) {
        //     return res.status(400).json({ error: " Invalid request parameters" });
        // }
        // const getUserByGSTIN = await userModel.findOne({ gstin: userGSTIN });
        // if (!getUserByGSTIN) {
        //     return res.status(400).send({ status: false, msg: "User(GSTIN) is not register " });
        // }
        // let SGST, CGST, IGST;
        // const existingInvoiceMap = new Map();
        // for (const invoice of await sellerBillModel.find({
        //     sellerGSTIN: { $in: data.map(row => row.sellerGSTIN) },
        //     invoiceNo: { $in: data.map(row => row.invoiceNo) },
        //     invoiceDate: { $in: data.map(row => row.invoiceDate) },
        // })) {
        //     existingInvoiceMap.set(`${invoice.sellerGSTIN}-${invoice.invoiceNo}-${invoice.invoiceDate}`, invoice);
        // }
        // const results = [];
        // const temp = []
        // for (const rowData of data) {
        //     rowData.userGSTIN = userGSTIN
        //     rowData.billType = billType
        //     let { invoiceNo, invoiceDate, sellerGSTIN, purchaserGSTIN, sellerName, purchaserName, totalAmount, gstRate, grandTotal, Cess } = rowData
        //     const billValidationResult = await billValidation(rowData);
        //     if (billValidationResult.error) {
        //         results.push({ errorMessage: billValidationResult.error.details[0].message, errorRow: rowData })
        //         continue;
        //     }
        //     const key = `${sellerGSTIN}-${invoiceNo}-${invoiceDate}`;
        //     if (existingInvoiceMap.has(key)) {
        //         continue;
        //     }
        //     if (!gstRate) {
        //         const calculatedGSTRate = ((Number(grandTotal) / Number(totalAmount)) - 1) * 100;
        //         gstRate = calculatedGSTRate.toFixed(2);
        //         const requiredGSTRates = new Set([0, 5, 12, 18, 28].map(rate => rate.toFixed(2)));
        //         if (!requiredGSTRates.has(gstRate)) {
        //             results.push({ errorMessage: "Grand total amount is incorrect", errorRow: rowData })
        //             continue;
        //         }
        //     } else {
        //         const validGrandAmount = Number(totalAmount) + (totalAmount * (gstRate / 100));
        //         if (validGrandAmount !== Number(grandTotal)) {
        //             results.push({ errorMessage: "Incorrect grand amount", errorRow: rowData });
        //             continue;
        //         }
        //     }
        //     if (billType == 'seller') {
        //         const getStateOfSeller = sellerGSTIN.slice(0, 2);
        //         IGST = getStateOfSeller === getStateOfUser ? 0 : gstRate;
        //         SGST = CGST = getStateOfSeller === getStateOfUser ? gstRate / 2 : 0;
        //         const sellerBillData = {
        //             userGSTIN,
        //             invoiceNo,
        //             sellerGSTIN,
        //             sellerName,
        //             invoiceDate,
        //             totalAmount,
        //             gstRate,
        //             grandTotal,
        //             SGST,
        //             CGST,
        //             IGST,
        //             Cess
        //         };
        //         temp.push(sellerBillData)
        //     } else {
        //         const getStateOfPurchaser = purchaserGSTIN.slice(0, 2);
        //         IGST = getStateOfPurchaser === getStateOfUser ? 0 : gstRate;
        //         SGST = CGST = getStateOfPurchaser === getStateOfUser ? gstRate / 2 : 0;
        //         const purchaserBillData = {
        //             userGSTIN,
        //             invoiceNo,
        //             purchaserGSTIN,
        //             purchaserName,
        //             invoiceDate,
        //             totalAmount,
        //             gstRate,
        //             grandTotal,
        //             SGST,
        //             CGST,
        //             IGST,
        //             Cess
        //         };
        //         temp.push(purchaserBillData)
        //     }
        // }
        // if (billType == "seller") {
        //     if (results.length == 0) {
        //         for (let ele of temp) {
        //             let sellerdoc = await new sellerBillModel(ele)
        //             await sellerdoc.save()
        //         }
        //         res.status(201).json({ data: " file uploaded successfully " })
        //     } else { res.status(400).json({ data: results }) }
        // } else {
        //     if (results.length == 0) {
        //         for (let ele of temp) {
        //             let purchaserDoc = await new purchaserBillModel(ele)
        //             await purchaserDoc.save()
        //         }
        //      return    res.status(201).json({ data: " file uploaded successfully " })
        //     } else { res.status(400).json({ data: results }) }
        // }
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getExcelFileFromUpload(req, res) {
    const filePath = path.join(__dirname, '../uploads/12ABCDE0000A1Z4/2024/june/032024_22ASDFG1234Q1Z3_GSTR2B_02062024 (1).xlsx');
    console.log(filePath);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
}


module.exports = { uploadExcelFile, getExcelFileFromUpload };



