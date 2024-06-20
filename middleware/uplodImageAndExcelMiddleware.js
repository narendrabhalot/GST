const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const gstin = req.params.gstin;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        const uploadPath = path.join('uploads', 'image', gstin, String(year), monthName);
        if (req.role && req.role != 'User') {
            cb(null, uploadPath);
        } else {
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        }

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
    destination: async (req, file, cb) => {
        const gstin = req.params.gstin; // Assuming gstin is retrieved from request params

        // Check if gstin exists and handle potential errors (e.g., return 400 Bad Request)
        if (!gstin) {
            return cb(new Error('Missing gstin parameter'), null);
        }
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        const uploadPath = path.join('uploads', "excel", gstin, String(year), monthName);

        try {
            await fs.promises.mkdir(uploadPath, { recursive: true }); // Create directory structure recursively
            cb(null, uploadPath);
        } catch (err) {
            console.error('Error creating upload directory:', err);
            // Handle errors more gracefully (e.g., return appropriate error response to client)
            cb(err, null);
        }
    },
    filename: (req, file, cb) => {
        // Optional: Customize filename based on requirements (e.g., include unique identifier)
        cb(null, file.originalname);
    },
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
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Set file size limit (5 MB in this example)
});
const excelUpload = upload.single("excel");
module.exports = { excelUpload, imageUpload };