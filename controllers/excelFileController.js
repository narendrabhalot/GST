const sellerBillModel = require('../models/sellerBillModel')
const purchaserBillModel = require('../models/purchaserBillModel')
const { sellerBillvalidation, purchaserBillvalidation, isValidRequestBody } = require("../util/validate")
const { checkInvoiceExistence } = require('../util/utils');
const userModel = require('../models/userModel');
const moment = require('moment')
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const xlsx = require("xlsx");


async function desiredData(data) {
    let finalMappingData = []
    const desiredKeyMap = {
        "Created Date": "creationDate",
        "User GSTIN": "userGSTIN",
        Invoice: "invoiceNo", // Assuming "Invoice" should be "invoiceNumber"
        "Invoice Date": "invoiceDate",
        "Seller Name": "sellerName",
        "Seller GSTIN": "sellerGSTIN",
        "Seller Type": "sellerType",
        "Purchaser Name": "purchaserName",
        "Purchaser GSTIN": "purchaserGSTIN",
        "Total Amount": "totalAmount",
        "GSTIN Rate": "gstRate",
        "Grand Total": "grandTotal",
        "Seller Type": "sellerType",
        SGST: "SGST",
        CGST: "CGST",
        IGST: "IGST",
        "Total Tax Paid": "totalTaxPaid",
        CESS: "cess",
    };
    data.map(async (row) => {
        const normalizedRow = {};
        for (const key in row) {
            const normalizedKey = desiredKeyMap[key] || key;
            normalizedRow[normalizedKey] = row[key];

        }
        finalMappingData.push(normalizedRow)
    })

    return finalMappingData
}
async function uploadExcelFile(req, res) {
    try {
        if (req.fileValidationError) {
            // Handle file validation error (e.g., send an error message to frontend)
            return res.status(400).send({ message: req.fileValidationError });
        }
        if (!req.file) {
            return res.status(400).send({ error: 'No excel file uploaded' });
        }
        let formattedDate;
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let data = xlsx.utils.sheet_to_json(worksheet, { raw: false });
        data = await desiredData(data)
        const { gstin, billType } = req.params
        const getStateOfUser = gstin.slice(0, 2);
        let billModel = billType == 'seller' ? sellerBillModel : purchaserBillModel
        let billValidationType = billType == 'seller' ? sellerBillvalidation : purchaserBillvalidation
        let gstinType = billType == 'seller' ? "sellerGSTIN" : "purchaserGSTIN"
        if (!isValidRequestBody(data)) {
            return res.status(400).json({ error: " Invalid request parameters" });
        }
        const getUserByGSTIN = await userModel.findOne({ gstin });
        if (!getUserByGSTIN) {
            return res.status(400).send({ status: false, msg: "User(GSTIN) is not register " });
        }
        let dataToBeStoreInDb = []
        if (billType == "seller") {
            for (let item of data) {
                let { invoiceNo, invoiceDate, sellerGSTIN, sellerName, totalAmount, gstRate, grandTotal, SGST, CGST, IGST, Cess } = item;
                if (item.sellerType == 'gstSale') {
                    checkduplicateData = await checkInvoiceExistence(sellerBillModel, gstin, item.invoiceDate, item.invoiceNo, item.sellerGSTIN, 'sellerGSTIN')
                    if (checkduplicateData && !checkduplicateData.status) {
                        console.log("Item already submited")
                        continue;
                    }

                }
                const sellerBillData = {
                    userGSTIN: gstin,
                    invoiceNo,
                    invoiceDate: moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
                    sellerGSTIN,
                    sellerName,
                    totalAmount,
                    gstRate,
                    grandTotal,
                    SGST,
                    CGST,
                    IGST,
                    Cess,
                    sellerType: item.sellerType
                };
                dataToBeStoreInDb.push(sellerBillData)
            }
        } else {

            for (let item of data) {
                let { invoiceNo, invoiceDate, purchaserGSTIN, purchaserName, totalAmount, gstRate, grandTotal, SGST, CGST, IGST, Cess } = item;
                checkduplicateData = await checkInvoiceExistence(purchaserBillModel, gstin, invoiceDate, invoiceNo, purchaserGSTIN, 'purchaserGSTIN');
                if (checkduplicateData && !checkduplicateData.status) {
                    continue
                }
                const purchaserBillData = {
                    userGSTIN: gstin,
                    invoiceNo,
                    invoiceDate: moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
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
                dataToBeStoreInDb.push(purchaserBillData)
            }




        }
        const billUpload = await billModel.insertMany(dataToBeStoreInDb)
        return res.status(200).send({ status: true, msg: "Excel uploaded successfully" })
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ errors: 'Internal server error', error: error });
    }
}
async function getExcelFileFromUpload(req, res) {
    let { userGSTIN, month, year } = req.query;
    console.log(userGSTIN, month, year)
    // Validate required parameters
    if (!userGSTIN || !month || !year) {
        return res.status(400).json({ error: 'Missing required query parameters: gstin, month, year' });
    }
    let directoryPath = path.join(__dirname, "../uploads", "excel", userGSTIN, year, month);
    directoryPath = path.normalize(directoryPath);
    console.log(directoryPath);
    try {
        await fsPromises.access(directoryPath, fs.constants.F_OK);
        // Read files in the directory
        const files = await fsPromises.readdir(directoryPath);
        if (files.length === 0) {
            return res.status(404).json({ status: false, msg: "No Excel available for submitted GSTIN" });
        }
        const excelFile = files.find(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
        if (!excelFile) {
            return res.status(404).json({ status: false, msg: "No valid Excel file found" });
        }
        const filePath = path.join(directoryPath, excelFile);

        res.setHeader('Content-Disposition', `attachment; filename=${excelFile}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', (err) => {
            console.error('Error reading file:', err);
            res.status(500).send('Error downloading file');
        });
        readStream.pipe(res);

    } catch (err) {
        if (err.code === 'ENOENT') { // Check for ENOENT (file or directory not found)
            return res.status(404).json({ error: 'Directory not found' });
        }
        console.error('Error accessing directory:', err);
        return res.status(500).json({ error: 'Internal server error', error: err.message }); // Generic error for security
    }
}
module.exports = { uploadExcelFile, getExcelFileFromUpload };



