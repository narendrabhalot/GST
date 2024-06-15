const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {

        // Access the GSTIN from req.params if needed
        const gstin = req.params.gstin;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        const uploadPath = path.join('uploads', 'image', gstin, String(year), monthName);
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




// *************upload excel file *********



const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const gstin = req.params.gstin;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        const uploadPath = path.join('uploads', "excel", gstin, String(year), monthName);

        try {
            await fs.promises.mkdir(uploadPath, { recursive: true }); // Create directory structure recursively
            cb(null, uploadPath);
        } catch (err) {
            console.error('Error creating upload directory:', err);
            // Handle errors appropriately (e.g., return error to client)
            cb(err, null); // Pass error back to Multer for handling
        }
    },
    filename: function (req, file, cb) {
        // const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.originalname);
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