const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Access the GSTIN from req.params if needed
        const gstin = req.params.gst;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        const uploadPath = path.join('uploads', gstin, String(year), monthName);
        
        // Create the directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniquePrefix + '-' + file.originalname);
    },
});
const uploadImage = multer({ storage: imageStorage });
const imageUpload = uploadImage.array("image");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads')); // Destination folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    }
});
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext === '.xlsx') {
        cb(null, true);
    } else {
        cb(new Error('Only .xlsx files are allowed'), false);
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});
const excelUpload = upload.single("excel");
module.exports = { excelUpload, imageUpload };