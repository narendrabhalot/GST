const userBillModel = require('../models/userBillModel');
const userModel = require('../models/userModel');
const { userBillValidation, isValidObjectId, isValidRequestBody } = require("../util/validate");
const xlsx = require("xlsx");

const uploadExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No excel file uploaded' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

        const promises = data.map(async (rowData) => {

            console.log("rowData is ", rowData);
            let { invoiceNo, invoiceDate, sellerGSTIN, totalAmount, gstRate, grandTotal } = rowData;
            const userId = req.params.id;

            if (!isValidObjectId(userId)) {
                return { error: "Invalid userId" };
            }
            // Validating request body
            if (!isValidRequestBody(rowData)) {
                return { error: "Invalid request parameters" };
            }
            rowData.invoiceNo = String(rowData.invoiceNo);
            rowData.invoiceDate = String(rowData.invoiceDate);
            rowData.gstRate = Number(rowData.gstRate);


            const userBillValidationResult = await userBillValidation(rowData);
            if (userBillValidationResult.error) {
                return { error: userBillValidationResult.error.message };
            }

            // Fetching user by ID
            let getUser;
            try {
                getUser = await userModel.findById(userId);
                if (!getUser) {
                    throw new Error("User not found");
                }
            } catch (error) {
                throw new Error("Error fetching user: " + error.message);
            }
            let SGST, CGST, IGST;
            const getStateOfSeller = sellerGSTIN.slice(0, 2);
            const getStateOfUser = getUser.gstin.slice(0, 2);
            if (getStateOfSeller === getStateOfUser) {
                SGST = Number(gstRate) / 2;
                CGST = Number(gstRate) / 2;
            } else {
                IGST = Number(gstRate);
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
            const userBill = new userBillModel(userBillData);
            await userBill.save();
            return userBill;
        });

        const results = await Promise.all(promises);
        res.status(201).json({ data: results });
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { uploadExcelFile };
