const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const Joi = require('joi');
const b2bPurchaserModel = require('../models/b2bPurchaserModel');
const uploadB2BExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileName = req.file.originalname;
        const getUserGSTIN = fileName.split('_')[1];
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
            return res.status(400).json({ error: gstError.details[0].message });
        }

        const validSheetNames = new Set(["B2B", "B2BA"])
        if (!validSheetNames.has(req.params.dataType)) {
            return res.status(400).json({ message: 'Invalid parameter: dataType must be either B2B or B2BA' });
        }

        const columnMapping = {
            '__EMPTY': 'purchaserGSTIN',
            '__EMPTY_1': 'purchaserName',
            'Invoice number': 'invoiceNo',
            'Invoice type': 'supply_type',
            'Invoice Date': 'invoiceDate',
            'Invoice Value(₹)': 'totalAmount',
            '__EMPTY_2': 'place_of_supply',
            '__EMPTY_3': 'Supply_Attract_Reverse_Charge',
            '__EMPTY_4': 'gstRate',
            '__EMPTY_5': 'Taxable_Value',
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
        const filePath = req.file.path;
        const workbook = await xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[req.params.dataType];
        let data = xlsx.utils.sheet_to_json(worksheet, { range: 5 });

        // const existingInvoiceMap = new Map();
        // for (const invoice of await b2bPurchaserModel.find({
        //     sellerGSTIN: { $in: data.map(row => row.sellerGSTIN) },
        //     invoiceNo: { $in: data.map(row => row.invoiceNo) },
        //     invoiceDate: { $in: data.map(row => row.invoiceDate) },
        // })) {
        //     existingInvoiceMap.set(`${invoice.sellerGSTIN}-${invoice.invoiceNo}-${invoice.invoiceDate}`, invoice);
        // }
        // if (columnMapping) {
        //     data.map(async (row) => {
        //         const normalizedRow = {};
        //         for (const key in row) {
        //             const normalizedKey = columnMapping[key] || key;
        //             normalizedRow[normalizedKey] = String(row[key]);
        //         }
        //         const validGrandAmount = Number(normalizedRow.totalAmount) + (normalizedRow.totalAmount * (normalizedRow.gstRate / 100));
        //         normalizedRow.grandTotal = String(validGrandAmount)
        //         console.log("normalizedRow is ", normalizedRow)
        //         let { invoiceNo, invoiceDate, purchaserGSTIN, purchaserName, totalAmount, gstRate, grandTotal, billType, SGST, CGST, IGST, Cess } = normalizedRow;
        //         const purchaserBillData = {
        //             userGSTIN: getUserGSTIN,
        //             invoiceNo,
        //             invoiceDate,
        //             purchaserGSTIN,
        //             purchaserName,
        //             totalAmount,
        //             gstRate,
        //             grandTotal,
        //             SGST,
        //             CGST,
        //             IGST,
        //             Cess
        //         };
        //         const purchaserBill = new b2bPurchaserModel(purchaserBillData);
        //         await purchaserBill.save();
        //     })
        // }
        res.json({ message: 'Data extracted and saved successfully' ,data:data});
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { uploadB2BExcelFile };
