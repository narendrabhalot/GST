const b2bPurchaser = require('../models/b2bPurchaserModel');
const reconcilitionModel = require('../models/reconciliationModel');
const purchaserBill = require('../models/purchaserBillModel');
const moment = require('moment');
const mongoose = require('mongoose');
const { isValidObjectId } = require('../util/validate')
const createReconciliation = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.error('Error: Mongoose connection not established!');
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const [aggregatedData, purchaserBills] = await Promise.all([
            b2bPurchaser.aggregate([
                {
                    $lookup: {
                        from: 'purchaserbills',
                        localField: 'userGSTIN',
                        foreignField: 'userGSTIN',
                        as: 'purchaserBillData'
                    }
                }
            ]),
            purchaserBill.find({})
        ]);
        const reconciliationDocs = [];
        for (const item of aggregatedData) {
            let status = "ER";
            if (item.purchaserBillData.length > 0) {

                for (const itemInItem of item.purchaserBillData) {
                    status = "ER";
                    if (itemInItem.invoiceNo === item.invoiceNo &&
                        itemInItem.invoiceDate === item.invoiceDate &&
                        itemInItem.purchaserGSTIN === item.purchaserGSTIN
                    ) {
                        if (itemInItem.grandTotal === item.grandTotal) {
                            status = "M"
                        } else {
                            status = "B"
                        }
                    }
                    reconciliationDocs.push({
                        userGSTIN: item.userGSTIN,
                        b2bInvoiceNo: item.invoiceNo,
                        b2bInvoiceDate: item.invoiceDate,
                        b2bPurchaserGSTIN: item.purchaserGSTIN,
                        b2bIGrandTotal: item.grandTotal,
                        b2bCess: item.Cess,
                        b2bSGST: item.SGST,
                        b2bCGST: item.CGST,
                        b2bIGST: item.IGST,
                        invoiceNo: itemInItem.invoiceNo,
                        invoiceDate: itemInItem.invoiceDate,
                        purchaserGSTIN: itemInItem.purchaserGSTIN,
                        grandTotal: itemInItem.grandTotal,
                        Cess: itemInItem.Cess,
                        SGST: itemInItem.SGST,
                        CGST: itemInItem.CGST,
                        IGST: itemInItem.IGST,
                        status
                    });
                }
            } else {
                reconciliationDocs.push({
                    userGSTIN: item.userGSTIN,
                    b2bInvoiceNo: item.invoiceNo,
                    b2bInvoiceDate: item.invoiceDate,
                    b2bPurchaserGSTIN: item.purchaserGSTIN,
                    b2bIGrandTotal: item.grandTotal,
                    b2bCess: item.Cess,
                    b2bSGST: item.SGST,
                    b2bCGST: item.CGST,
                    b2bIGST: item.IGST,
                    status
                });
            }
        }
        const filteredCollectionTwoData = purchaserBills.filter(item => {
            return !aggregatedData.some(joinedItem => joinedItem.userGSTIN === item.userGSTIN);
        });
        for (const item of filteredCollectionTwoData) {
            reconciliationDocs.push({
                userGSTIN: item.userGSTIN,
                invoiceNo: item.invoiceNo,
                invoiceDate: item.invoiceDate,
                purchaserGSTIN: item.purchaserGSTIN,
                grandTotal: item.grandTotal,
                SGST: item.SGST,
                CGST: item.CGST,
                IGST: item.IGST,
                Cess: item.Cess,
                status: "NR"
            });
        }
        await reconcilitionModel.bulkWrite(reconciliationDocs.map(doc => ({
            insertOne: { document: doc }
        })));
        res.status(201).send({ status: true, data: "Reconciliation created successfully", data: reconciliationDocs });
    } catch (error) {
        console.error('Error in createReconciliation:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getReconciliationByGSTIN = async (req, res) => {
    try {
        const { gstin: userGSTIN } = req.params;
        function getFinancialYearStartDate() {
            const currentDate = moment();
            const fiscalMonth = 2; // Assuming fiscal year starts in March (0-indexed)
            if (fiscalMonth <= currentDate.month()) {
                return moment([currentDate.year() - 1, currentDate.month(), 31]).format('DD/MM/YYYY');
            } else {
                return moment([currentDate.year(), currentDate.month(), 31]).format('DD/MM/YYYY');
            }
        }
        let startDate = getFinancialYearStartDate();
        startDate = moment(startDate, 'DD/MM/YYYY');
        const endDate = moment().format('DD/MM/YYYY');
        const reconciliationRecords = await reconcilitionModel.find({ userGSTIN });
        const filteredReconciliationRecords = reconciliationRecords.filter(item => {
            try {
                const itemDate = moment(item.b2bInvoiceDate, 'DD/MM/YYYY');

                return itemDate.isValid() && itemDate.isAfter(startDate);

            } catch (error) {
                console.error(`Error parsing invoice date for item: ${item.b2bInvoiceDate}`, error);
                return false;
            }
        });
        if (!filteredReconciliationRecords.length) {
            return res.status(404).json({ status: false, message: "No reconciliation record found" });
        }
        return res.status(200).json({
            status: true,
            data: filteredReconciliationRecords
        });
    } catch (error) {
        console.error("Error retrieving reconciliation records:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

module.exports = { createReconciliation, getReconciliationByGSTIN };
