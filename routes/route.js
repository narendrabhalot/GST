const express = require("express");
const router = express.Router();
const { createUser, updateUserPlanByGSTIN, getUser, updateUser } = require('../controllers/userController')
const { creatAdmin, adminLogin } = require('../controllers/adminController')
const { sendOTP, verifyOTP } = require('../controllers/authController')
const { createUserBill, getBillByDateRangeAndUserGSTIN } = require('../controllers/billController')
const { uploadImage, getImage, getImageByDateRange } = require('../controllers/imageUploadController')
const { uploadB2BExcelFile } = require('../controllers/b2bPurchaserController')
const { uploadB2BAExcelFile } = require('../controllers/b2baPurchaserController')
const { authentication } = require('../middleware/auth')
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
// router.post('/userBill/:gstin', createUserBill)
router.post('/userBill/:gstin', authentication, createUserBill)//////****** */
// router.post('/user/:gstin', updateUserPlanByGSTIN)
router.post('/user-update-plan/:gstin', authentication, updateUserPlanByGSTIN)/////********** */
// for bill route 
router.get('/getBill/:billType', authentication, getBillByDateRangeAndUserGSTIN)

// Image Upload route
router.post('/upload-image/:gstin/:userType', authentication, imageUpload, uploadImage)
router.get('/images/:type', authentication, getImage)
router.get('/imageDate', authentication, getImageByDateRange)

// upload excel user route 

router.post('/uploadexcel/:billType/:gstin', authentication, excelUpload)
// for loan route
router.post('/loan', authentication, createLoan)
// for reconciliation 
router.get('/reconciliation/:gstin', authentication, getReconciliationByGSTIN)
// for plan and Sub plan apis 

router.get('/plan-subplan', authentication, getPlanWithSubPlan)
router.get('/plan-id/:id', authentication, getPlanById)  ///////////////******* */
router.get('/myPlan/:gstin', authentication, getMyPlan)

// for history api
router.get('/billHistory', authentication, getBillHistoryByUserType)
router.get('/imageHistory/:gstin/:userType', authentication, getImageHistoryByUserType)
// router.put('/bill-History/:billId/:billType', updateBillHistory)
router.put('/updateBillHistory/:billId/:billType', authentication, updateBillHistory) ///////********* */
router.get('/filling/:userGSTIN', authentication, getFilingHistory)
// for composite API
router.post('/composite', authentication, createComposite)

//   ***************************    ADMIN  API ****************** 

// for user   api 
// router.get('/user', getUser)
router.get('/users', authentication, getUser)
// router.put('/user/:id', updateUser)
router.put('/user-update/:id', authentication, updateUser)



// For  create admin



router.post('/admin', creatAdmin)
router.post('/adminLogIn', adminLogin)
router.post('/upload-b2bexcel/:gstin', authentication, excelUpload, uploadB2BExcelFile)
router.post('/upload-b2baexcel', authentication, excelUpload, uploadB2BAExcelFile)
router.post('/excel-bills/:gstin/:billType', authentication, excelUpload, uploadExcelFile)    //// uplod of user bill which is upload by user 
router.get('/getexcel', authentication, getExcelFileFromUpload)
// for  reconciliation api 


router.post('/reconciliation', authentication, createReconciliation)    // create reconciliation data 

//for plan api


router.post('/create-plan', authentication, createPlan)   /// carete plan and subplan 
router.get('/get-plan', authentication, getPlan)       // get all plan with subplan 
router.post('/create-subPlan/:planId', authentication, createSubPlan)   //  add new sub plan when plan already exist 
router.put('/updateSubPlan/:planId/:subPlanId', authentication, updateSubPlan)   //  update sub-plan by plan and sub plan id
router.delete('/deletePlan/:id', authentication, deletePlan)        //////////////////////******* */




/// for loan api 

router.get('/get-loan', authentication, getLoans)



// router.all("/*", function (req, res) {
//   res
//     .status(404)
//     .send({ status: false, msg: "The api you requested is not available" });
// });
module.exports = router;