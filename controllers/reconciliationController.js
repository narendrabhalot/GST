const b2bPurchaser = require('../models/b2bPurchaserModel');
const reconcilitionModel = require('../models/reconciliationModel');
const purchaserBill = require('../models/purchaserBillModel');
const mongoose = require('mongoose');
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
                    if (itemInItem.invoiceNo === item.invoiceNo &&
                        itemInItem.invoiceDate === item.invoiceDate &&
                        itemInItem.purchaserGSTIN === item.purchaserGSTIN &&
                        itemInItem.grandTotal === item.grandTotal
                    ) {
                        status = "M"
                    } else {
                        status = "B"
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
module.exports = { createReconciliation };
