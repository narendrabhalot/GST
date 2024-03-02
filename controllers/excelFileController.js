const sellerBillModel = require('../models/sellerBillModel')
const userModel = require('../models/userModel');
const { billValidation, isValidRequestBody } = require("../util/validate");
const xlsx = require("xlsx");
async function uploadExcelFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No excel file uploaded' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });
        const userGSTIN = req.params.id;
        const getStateOfUser = userGSTIN.slice(0, 2);
        const billType = req.params.billType
        if (!isValidRequestBody(data)) {
            return res.status(400).json({ error: " Invalid request parameters" });
        }
        const getUserByGSTIN = await userModel.findOne({ gstin: userGSTIN });
        if (!getUserByGSTIN) {
            throw new Error("User not found");
        }

        let SGST, CGST, IGST;
        const existingInvoiceMap = new Map();
        for (const invoice of await sellerBillModel.find({
            sellerGSTIN: { $in: data.map(row => row.sellerGSTIN) },
            invoiceNo: { $in: data.map(row => row.invoiceNo) },
            invoiceDate: { $in: data.map(row => row.invoiceDate) },
        })) {
            existingInvoiceMap.set(`${invoice.sellerGSTIN}-${invoice.invoiceNo}-${invoice.invoiceDate}`, invoice);
        }
        const results = [];
        const temp = []
        for (const rowData of data) {
            let { invoiceNo, invoiceDate, sellerGSTIN, purchaserGSTIN, sellerName, purchaserName, totalAmount, gstRate, grandTotal, billType } = rowData

            const billValidationResult = await billValidation(rowData);
            if (billValidationResult.error) {
                results.push({ errorMessage: billValidationResult.error.details[0].message, errorRow: rowData })
                continue;
            }
            const key = `${sellerGSTIN}-${invoiceNo}-${invoiceDate}`;
            if (existingInvoiceMap.has(key)) {
                continue;
            }
            if (!gstRate) {
                const calculatedGSTRate = ((Number(grandTotal) / Number(totalAmount)) - 1) * 100;
                gstRate = calculatedGSTRate.toFixed(2);
                const requiredGSTRates = new Set([0, 5, 12, 18, 28].map(rate => rate.toFixed(2)));
                if (!requiredGSTRates.has(gstRate)) {
                    results.push({ errorMessage: "Grand total amount is incorrect", errorRow: rowData })
                    continue;
                }
            } else {
                const validGrandAmount = Number(totalAmount) + (totalAmount * (gstRate / 100));
                if (validGrandAmount !== Number(grandTotal)) {
                    results.push({ errorMessage: "Incorrect grand amount", errorRow: rowData });
                    continue;
                }
            }
            const getStateOfSeller = sellerGSTIN.slice(0, 2);
            IGST = getStateOfSeller === getStateOfUser ? 0 : gstRate;
            SGST = CGST = getStateOfSeller === getStateOfUser ? gstRate / 2 : 0;
            const userBillData = {
                userGSTIN,
                invoiceNo,
                sellerGSTIN,
                sellerName,
                invoiceDate,
                totalAmount,
                gstRate,
                grandTotal,
                SGST,
                CGST,
                IGST,
            };
            temp.push(userBillData)
        }
        if (results.length == 0) {
            for (let ele of temp) {
                let sellerdoc = await new sellerBillModel(ele)
                await sellerdoc.save()
            }
            res.status(201).json({ data: " file uploaded successfully " })
        } else { res.status(400).json({ data: results }) }

    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
module.exports = { uploadExcelFile };



