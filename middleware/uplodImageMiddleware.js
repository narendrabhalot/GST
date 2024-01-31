const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set the file name
    },
});
const upload = multer({ storage: storage });
const imageupload = upload.single('image');
module.exports = { imageupload };
