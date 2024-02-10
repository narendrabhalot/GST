const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const gstin = req.params.gst;
        console.log(gstin)
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });
        console.log(monthName)
        const uploadPath = path.join('uploads', gstin, String(year), monthName);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniquePrefix_ = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniquePrefix_ + '-' + file.originalname);
    },
});


const upload = multer({ storage: storage });
const imageupload = upload.array("image");

module.exports = { imageupload }

