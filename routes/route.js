const express = require("express");
const router = express.Router();
const{createUser} = require('../controllers/userController')
const {sendOTP,verifyOTP} = require('../controllers/authController')
const {uploadImage}=require('../controllers/imageUploadController')
const {imageupload}=require('../middleware/uplodImageMiddleware')
//FOR User route
router.post('/register',createUser)
router.post('/send-otp',sendOTP)
router.post('/verify-otp',verifyOTP)
// Image Upload route
router.post('/upload-image', imageupload,uploadImage)
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});

module.exports = router;