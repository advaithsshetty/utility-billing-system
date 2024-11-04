const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { get } = require('http');

async function generateInvoice(paymentRequest) {
    const invoiceDir = config.invoiceDir || 'invoices';
    if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

    const invoicePath = path.join(invoiceDir, `${paymentRequest.userId}-${Date.now()}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    return new Promise((resolve, reject) => {
        try {
            const writeStream = fs.createWriteStream(invoicePath);
            doc.pipe(writeStream);

            doc.fontSize(24).text("Mangalore Utility Services", { align: "center", underline: true });
            doc.moveDown(1);
            doc.fontSize(18).text("Utility Bill Invoice", { align: "center" });
            doc.fontSize(12).text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: "right" });
            doc.moveDown();

            doc
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(1);
            doc.fontSize(12).text(`User ID: ${paymentRequest.userId}`);
            doc.text(`Billing Period: ${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString()}`);
            doc.text(`Utility Type: ${paymentRequest.type}`);
            doc.moveDown(1);

            doc.fontSize(14).text("Billing Summary", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            doc.text(`Amount Due: Rs. ${paymentRequest.amount.toFixed(2)}`, { indent: 20 });
            doc.moveDown();

            doc
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown();
            doc.fontSize(10).text("Thank you for your payment!", { align: "center" });
            doc.text("For billing inquiries, contact our customer service.", {
                align: "center",
            });

            doc.end();
            writeStream.on('finish', () => resolve(invoicePath));
            writeStream.on('error', (writeError) => {
                console.error('Error writing to file:', writeError);
                reject(writeError);
            });
        } catch (error) {
            console.error('Error generating invoice:', error);
            reject(error);
        }
    });
}

async function getInvoices(userId) {
    const invoiceDir = path.join(__dirname, config.invoiceDir || 'invoices');

    if (!fs.existsSync(invoiceDir)) {
        console.log(`No invoice directory found at: ${invoiceDir}`);
        return [];
    }

    try {
        const files = fs.readdirSync(invoiceDir);
        const filesArray = files.filter(file => file.startsWith(userId)).map(file => path.join(invoiceDir, file));
        return filesArray;
    } catch (error) {
        console.error("Error retrieving invoices:", error);
        return [];
    }
}

module.exports = { generateInvoice, getInvoices };