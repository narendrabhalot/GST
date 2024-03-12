const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const moment = require('moment')
const Joi = require('joi');
const b2bPurchaserModel = require('../models/b2bPurchaserModel');
const { billValidation } = require("../util/validate");
function mappingOfExcelData(data) {
    const finalMappingData = [];
    const columnMapping = {
        '__EMPTY': "oldInvoiceNumber",
        '__EMPTY_1': 'oldInvoiceDate',
        '__EMPTY_2': 'purchaserGSTIN',
        '__EMPTY_3': 'purchaserName',
        'Invoice number': 'invoiceNo',
        'Invoice type': 'supply_type',
        'Invoice Date': 'invoiceDate',
        'Invoice Value(₹)': 'grandTotal',
        '__EMPTY_4': 'place_of_supply',
        '__EMPTY_5': 'Supply_Attract_Reverse_Charge',
        '__EMPTY_6': 'gstRate',
        '__EMPTY_7': 'totalAmount',
        'Integrated Tax(₹)': 'IGST',
        'Central Tax(₹)': 'CGST',
        'State/UT Tax(₹)': 'SGST',
        'Cess(₹)': 'Cess(₹)',
        '__EMPTY_8': 'GSTR-1/IFF/GSTR-5_Period',
        '__EMPTY_9': 'GSTR-1/IFF/GSTR-5_Filing Date',
        '__EMPTY_10': 'ITC_Availability',
        '__EMPTY_11': 'Reason',
        '__EMPTY_12': 'Applicable_%_of_Tax_Rate',
        '__EMPTY_13': 'Source',
        '__EMPTY_14': 'IRN',
        '__EMPTY_15': 'IRN Date'
    };
    data.forEach(row => {
        const normalizedRow = {};
        for (const key in row) {
            const normalizedKey = columnMapping[key] || key;
            normalizedRow[normalizedKey] = String(row[key]);
        }
        finalMappingData.push(normalizedRow);
    });
    return finalMappingData;
}
const uploadB2BAExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileName = req.file.originalname;
        const sheetName = req.body.sheetName;
        if (!sheetName) {
            return res.status(400).send({ status: false, msg: "Sheet name body parameter is required " });
        }
        const range = req.body.startRowData ? req.body.startRowData - 2 : 5;
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
        let validatedGST;
        try {
            ({ error: gstError, value: validatedGST } = gstSchema.validate(getUserGSTIN));
            if (gstError) {
                getUserGSTIN = req.body.userGSTIN;
                if (!getUserGSTIN || getUserGSTIN.length === 0) {
                    return res.status(400).send({ status: false, msg: "User's GSTIN number is required " });
                }
            }
        } catch (error) {
            console.error("Error validating GSTIN:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const validSheetNames = new Set(["B2B", "B2BA"]);
        if (!validSheetNames.has(sheetName)) {
            return res.status(400).json({ message: 'Invalid parameter: dataType must be either B2B or B2BA' });
        }
        const filePath = req.file.path;
        const workbook = await xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[sheetName];
        let data = xlsx.utils.sheet_to_json(worksheet, { range: 6, dateNF: 'DD/MM/YYYY' });
        console.log(data)
        const mappingData = mappingOfExcelData(data);

        const existingInvoiceMap = new Map();

        try {
            const existingInvoices = await b2bPurchaserModel.find({
                $and: [
                    { purchaserGSTIN: { $in: mappingData.map(row => row.purchaserGSTIN) } },
                    { invoiceNo: { $in: mappingData.map(row => row.invoiceNo) } },
                    { invoiceDate: { $in: mappingData.map(row => row.invoiceDate) } },
                ]
            });
            existingInvoices.forEach(invoice => {
                existingInvoiceMap.set(`${invoice.purchaserGSTIN}-${invoice.invoiceNo}-${invoice.invoiceDate}`, invoice);
            });
        } catch (error) {
            console.error("Error fetching existing invoices:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
        for (const item of mappingData) {
            const jsDate = item.oldInvoiceDate ? new Date((item.oldInvoiceDate - 25569) * 86400000) : null;
            item.oldInvoiceDate = moment(jsDate).format('DD/MM/YYYY');
            const { invoiceNo, invoiceDate, purchaserGSTIN, purchaserName, totalAmount, gstRate, grandTotal, SGST, CGST, IGST, Cess, oldInvoiceNumber, oldInvoiceDate } = item;
            const key = `${purchaserGSTIN}-${invoiceNo}-${invoiceDate}`;
            if (existingInvoiceMap.has(key)) {
                const filter = { purchaserGSTIN: purchaserGSTIN, invoiceNo: invoiceNo, invoiceDate: invoiceDate };
                const newDocument = {
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
                    Cess,
                    amendment: "Y",
                    oldInvoiceNumber,
                    oldInvoiceDate
                };
                try {
                    const updatedDocument = await b2bPurchaserModel.findOneAndUpdate(filter, newDocument, { insert: true });
                } catch (error) {
                    console.error("Error updating document:", error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
            }
        }
        return res.json({ status: true, msg: "update successfully", data: data });
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { uploadB2BAExcelFile };
