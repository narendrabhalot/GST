const express = require("express");
const router = express.Router();
const { createUser, updateUserPlanByGSTIN, getUser, updateUser } = require('../controllers/userController')
const { creatAdmin, adminLogin } = require('../controllers/adminController')
const { sendOTP, verifyOTP } = require('../controllers/authController')
const { createUserBill, getBillByDateRangeAndUserGSTIN } = require('../controllers/billController')
const { uploadImage, getImage, getImageByDateRange } = require('../controllers/imageUploadController')
const { uploadB2BExcelFile } = require('../controllers/b2bPurchaserController')
const { uploadB2BAExcelFile } = require('../controllers/b2baPurchaserController')
const { createReconciliation, getReconciliationByGSTIN } = require('../controllers/reconciliationController')
const { uploadExcelFile, getExcelFileFromUpload } = require('../controllers/excelFileController')
const { excelUpload, imageUpload } = require('../middleware/uplodImageAndExcelMiddleware')
const { createLoan, getLoans } = require('../controllers/loanController')
const { createPlan, createSubPlan, deletePlan, updateSubPlan, getPlan, getMyPlan, getPlanById, getPlanWithSubPlan, deletedPlan } = require('../controllers/planController')
const { createComposite } = require('../controllers/compositeController')
const { getBillHistoryByUserType, getImageHistoryByUserType, updateBillHistory, getFilingHistory } = require('../controllers/historyController')
///// *******************   APP APIS **********************
router.post('/register', createUser)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/userBill/:gstin', createUserBill)
router.post('/user/:gstin', updateUserPlanByGSTIN)
// for bill route 
router.get('/getBill/:billType', getBillByDateRangeAndUserGSTIN)

// Image Upload route
router.post('/upload-image/:gstin/:userType', imageUpload, uploadImage)
router.get('/images/:type', getImage)
router.get('/imageDate', getImageByDateRange)

// upload excel user route 

router.post('/uploadexcel/:billType/:gstin', excelUpload)
// for loan route
router.post('/loan', createLoan)
// for reconciliation 
router.get('/reconciliation/:gstin', getReconciliationByGSTIN)
// for plan and Sub plan apis 

router.get('/plan-subplan', getPlanWithSubPlan)
router.get('/plan/:id', getPlanById)
router.get('/myPlan/:gstin', getMyPlan)
router.delete('/plan/:id', deletePlan)

// for history api
router.get('/billHistory', getBillHistoryByUserType)
router.get('/imageHistory/:gstin/:userType', getImageHistoryByUserType)
router.put('/bill-History/:billId/:billType', updateBillHistory)
router.get('/filling/:userGSTIN', getFilingHistory)
// for composite API
router.post('/composite', createComposite)

//   ***************************    ADMIN  API ****************** 

// for user   api 
router.get('/user', getUser)
router.put('/user/:id', updateUser)



// For  create admin
router.post('/admin', creatAdmin)
router.post('/adminLogIn', adminLogin)
router.post('/upload-b2bexcel/:gstin', excelUpload, uploadB2BExcelFile)
router.post('/upload-b2baexcel', excelUpload, uploadB2BAExcelFile)
router.post('/excel-bills/:gstin/:billType', excelUpload, uploadExcelFile)    //// uplod of user bill which is upload by user 
router.get('/excel', getExcelFileFromUpload)


// for  reconciliation api 
router.post('/reconciliation', createReconciliation)    // create reconciliation data 

//for plan api
router.post('/plan', createPlan)   /// carete plan and subplan 
router.get('/plan', getPlan)       // get all plan with subplan 
router.post('/subPlan/:planId', createSubPlan)   //  add new sub plan when plan already exist 
router.put('/subPlan/:planId/:subPlanId', updateSubPlan)   //  update sub-plan by plan and sub plan id



/// for loan api 

router.get('/loan', getLoans)



// router.all("/*", function (req, res) {
//   res
//     .status(404)
//     .send({ status: false, msg: "The api you requested is not available" });
// });
module.exports = router;