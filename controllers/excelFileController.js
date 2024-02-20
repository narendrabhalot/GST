const userBillModel = require('../models/userBillModel')
const xlsx = require("xlsx")
const uploadExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log("dtaa is a ", data)
        await Promise.all(data.map(async (rowData) => {
            const newData = new userBillModel(rowData);
            await newData.save();
        }));
        res.status(200).json({ message: 'Excel data successfully uploaded and saved to MongoDB' });
    } catch (error) {
        console.error('Error processing and saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports = { uploadExcelFile };
