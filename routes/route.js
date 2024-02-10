const express = require("express");
const router = express.Router();
const { createUser } = require('../controllers/userController')
const { sendOTP, verifyOTP } = require('../controllers/authController')
const { createUserBill } = require('../controllers/userBillController')
const { uploadImage, getImage, getImageByDateRange } = require('../controllers/imageUploadController')
const { imageupload } = require('../middleware/uplodImageMiddleware')
//FOR User route
router.post('/register', createUser)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/userBill/:id', createUserBill)
// Image Upload route
router.post('/upload-image/:gst', imageupload, uploadImage)
router.get('/images', getImage)
router.post('/imageDate', getImageByDateRange)


router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});


module.exports = router;