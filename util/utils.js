const moment = require('moment');

async function checkInvoiceExistence(model, userGSTIN, invoiceDate, invoiceNo, gstin, gstinType) {
    console.log(model, userGSTIN, invoiceDate, invoiceNo, gstin, gstinType)
    if (!gstin || !invoiceNo || !invoiceDate) {
        return {
            status: false,
            code: 400,
            msg: "GSTIN, invoiceNo, and invoiceDate are required fields."
        };
    }

    try {
        const mappingData = await model.find({ userGSTIN });
        const existingInvoiceMap = new Map();
        console.log(invoiceDate)
        const formattedDate = moment(invoiceDate, "DD/MM/YYYY").format("YYYY-MM-DD");

        mappingData.forEach(invoice => {
            const invoiceGstin = invoice[gstinType];
            const formattedInvoiceDate = moment(invoice.invoiceDate).format("YYYY-MM-DD");
            if (invoiceGstin && invoice.invoiceNo && invoice.invoiceDate) {
                const key = `${invoiceGstin.trim().toLowerCase()}-${invoice.invoiceNo.trim().toLowerCase()}-${formattedInvoiceDate}`;
                existingInvoiceMap.set(key, invoice);
            }
        });

        const newInvoiceKey = `${gstin.trim().toLowerCase()}-${invoiceNo.trim().toLowerCase()}-${formattedDate}`;
        if (existingInvoiceMap.has(newInvoiceKey)) {
            console.log(existingInvoiceMap.has(newInvoiceKey))
            return {
                status: false,
                code: 400,
                msg: "Combination of userBillGSTIN, invoiceDate, and invoiceNo already exists.",
                data: existingInvoiceMap.get(newInvoiceKey)
            };
        }

        return { status: true };
    } catch (error) {
        console.error(error);
        return {
            status: false,
            code: 500,
            msg: "Internal Server Error"
        };
    }
}


module.exports = {
    checkInvoiceExistence
};