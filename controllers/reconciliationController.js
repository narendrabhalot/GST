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
        const gstin = req.params.gstin
        const IST_TIMEZONE = 'Asia/Kolkata';
        function getFinancialYearStartDate() {
            const currentDate = moment();
            const financialMonth = 2;
            console.log(currentDate.month())
            if (financialMonth <= currentDate.month()) {
                return moment.tz(`${moment().year()}-04-01`, "YYYY-MM-DD", "Asia/Kolkata").add(5, 'hours').add(30, 'minutes').toDate().toString();
            } else {
                return moment.tz(`${moment().year() - 1}-03-01`, "YYYY-MM-DD", "Asia/Kolkata").add(5, 'hours').add(30, 'minutes').toDate().toString();
            }
        }
        let startDate = getFinancialYearStartDate();

        startDate = moment.tz(startDate, IST_TIMEZONE).add(5, 'hours').add(30, 'minutes').toDate().toString()
        const endDate = moment.tz(IST_TIMEZONE).add(5, 'hours').add(30, 'minutes').toDate().toString()
        console.log(startDate, endDate)

        const reconciliationRecords = await reconcilitionModel.find({
            userGSTIN: gstin,
            $or: [
                { b2bInvoiceDate: { $gte: startDate, $lte: endDate } },
                { invoiceDate: { $gte: startDate, $lte: endDate } }
            ]
        });

        if (!reconciliationRecords.length) {
            return res.status(404).json({ status: false, message: "No reconciliation record found" });
        }
        return res.status(200).json({
            status: true,
            data: reconciliationRecords
        });
    } catch (error) {
        console.error("Error retrieving reconciliation records:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};
module.exports = { createReconciliation, getReconciliationByGSTIN };
