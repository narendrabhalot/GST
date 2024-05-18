const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const Joi = require('joi');
const b2bPurchaserModel = require('../models/b2bPurchaserModel');
const { billValidation } = require("../util/validate");
function mappingOfExcelData(data) {
    const finalMappingData = []
    const columnMapping = {
        '__EMPTY': 'purchaserGSTIN',
        '__EMPTY_1': 'purchaserName',
        'Invoice number': 'invoiceNo',
        'Invoice type': 'supply_type',
        'Invoice Date': 'invoiceDate',
        'Invoice Value(₹)': 'grandTotal',
        '__EMPTY_2': 'place_of_supply',
        '__EMPTY_3': 'Supply_Attract_Reverse_Charge',
        '__EMPTY_4': 'gstRate',
        '__EMPTY_5': 'totalAmount',
        'Integrated Tax(₹)': 'IGST',
        'Central Tax(₹)': 'CGST',
        'State/UT Tax(₹)': 'SGST',
        'Cess(₹)': 'Cess(₹)',
        '__EMPTY_6': 'GSTR-1/IFF/GSTR-5_Period',
        '__EMPTY_7': 'GSTR-1/IFF/GSTR-5_Filing Date',
        '__EMPTY_8': 'ITC_Availability',
        '__EMPTY_9': 'Reason',
        '__EMPTY_10': 'Applicable_%_of_Tax_Rate',
        '__EMPTY_11': 'Source',
        '__EMPTY_12': 'IRN',
        '__EMPTY_13': 'IRN Date',
    };
    data.map(async (row) => {
        const normalizedRow = {};
        for (const key in row) {
            const normalizedKey = columnMapping[key] || key;
            normalizedRow[normalizedKey] = String(row[key]);
        }

        finalMappingData.push(normalizedRow)
    })

    return finalMappingData
}
const uploadB2BExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileName = req.file.originalname;
        const sheetName = req.body.sheetName
        if (!sheetName) {
            return res.status(400).send({ status: false, msg: "Sheet name body parameter is required " })
        }
        const range = req.body.startRowData ? req.body.startRowData - 2 : 5
        let getUserGSTIN = fileName.split('_')[1];
        const gstSchema = Joi.string()
            .trim()
            .length(15)
            .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid GSTIN format',
                'any.required': 'GSTIN number is required',
                'string.length': 'GSTIN length must be 15 characters long',
            });
        const { error: gstError, value: validatedGST } = gstSchema.validate(getUserGSTIN);
        if (gstError) {
            getUserGSTIN = req.body.userGSTIN
            if (getUserGSTIN.length == 0) {
                return res.status(400).send({ status: false, msg: "User's GSTIN number is required " })
            }
        }
        const validSheetNames = new Set(["B2B", "B2BA"])
        if (!validSheetNames.has(sheetName)) {
            return res.status(400).json({ message: 'Invalid parameter: dataType must be either B2B or B2BA' });
        }
        const filePath = req.file.path;
        const workbook = await xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[sheetName];
        let data = xlsx.utils.sheet_to_json(worksheet, { range: range });

        const mappingDatais = mappingOfExcelData(data)

        const existingInvoiceMap = new Map();
        for (const invoice of await b2bPurchaserModel.find({
            $and: [
                { purchaserGSTIN: { $in: mappingDatais.map(row => row.purchaserGSTIN) } },
                { invoiceNo: { $in: mappingDatais.map(row => row.invoiceNo) } },
                { invoiceDate: { $in: mappingDatais.map(row => new Date(row.invoiceDate)) } }
            ]
        }
        )) {
            existingInvoiceMap.set(`${invoice.purchaserGSTIN}-${invoice.invoiceNo}-${invoice.invoiceDate}`, invoice)
        }
        console
            .log("existingInvoiceMap is ", existingInvoiceMap)
        const results = []
        for (let item of mappingDatais) {
            let { invoiceNo, invoiceDate, purchaserGSTIN, purchaserName, totalAmount, gstRate, grandTotal, billType, SGST, CGST, IGST, Cess } = item;
            let sendDatais = { invoiceNo, invoiceDate, purchaserGSTIN, purchaserName, totalAmount, gstRate, grandTotal, billType, Cess, userGSTIN: getUserGSTIN }
            const billValidationResult = await billValidation(sendDatais);
            if (billValidationResult.error) {
                results.push({ errorMessage: billValidationResult.error.details[0].message, errorRow: item })
                continue;
            }
            const key = `${purchaserGSTIN}-${invoiceNo}-${invoiceDate}`;
            if (existingInvoiceMap.has(key)) {
                continue;
            }
            const B2BPurchaserData = {
                userGSTIN: getUserGSTIN,
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
            const purchaserBill = new b2bPurchaserModel(B2BPurchaserData);
            await purchaserBill.save();
        }
        if (results.length == 0) {
            return res.status(200).json({ status: true, message: 'Data extracted and saved successfully' });
        } else {
            return res.json({ status: false, error: results });
        }
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = { uploadB2BExcelFile };
