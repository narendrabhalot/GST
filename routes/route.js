const express = require("express");
const router = express.Router();
const { createUser, updateUser } = require('../controllers/userController')
const { sendOTP, verifyOTP } = require('../controllers/authController')
const { createUserBill } = require('../controllers/billController')
const { uploadImage, getImage, getImageByDateRange } = require('../controllers/imageUploadController')
const { uploadB2BExcelFile } = require('../controllers/b2bPurchaserController')
const { uploadB2BAExcelFile } = require('../controllers/b2baPurchaserController')
const { createReconciliation, getReconciliationByGSTIN } = require('../controllers/reconciliationController')
const { uploadExcelFile } = require('../controllers/excelFileController')
const { excelUpload, imageUpload } = require('../middleware/uplodImageMiddleware')
const { createLoan } = require('../controllers/loanController')
const { createPlan, deletePlan, getPlan } = require('../controllers/planController')
//FOR User route
router.post('/register', createUser)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/userBill/:gstin', createUserBill)
router.post('/user/:gstin', updateUser)
// Image Upload route
router.post('/upload-image/:gst/:userType', imageUpload, uploadImage)
router.get('/images', getImage)
router.post('/imageDate', getImageByDateRange)
// for excel file router 
router.post('/upload-excel/:billType/:id', excelUpload, uploadExcelFile)
router.post('/upload-b2bexcel', excelUpload, uploadB2BExcelFile)
router.post('/upload-b2baexcel', excelUpload, uploadB2BAExcelFile)
// for loan route
router.post('/loan', createLoan)
// for reconciliation 
router.post('/reconciliation', createReconciliation)
router.get('/reconciliation/:gstin', getReconciliationByGSTIN)
// for plan api
router.post('/plan', createPlan)
router.get('/plan', getPlan)
router.delete('/plan/:id', deletePlan)
router.all("/*", function (req, res) {
  res
    .status(404)
    .send({ status: false, msg: "The api you requested is not available" });
});
module.exports = router;