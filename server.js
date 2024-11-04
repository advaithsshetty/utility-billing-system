const express = require('express');
const bodyParser = require('body-parser');
const Joi = require('joi');
const paymentQueue = require('./paymentQueue');
const invoiceGenerator = require('./invoiceGenerator');
const transactionStack = require('./transactionStack');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const paymentSchema = Joi.object({
    userId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    type: Joi.string().valid("electricity", "water", "gas").required(),
    urgency: Joi.string().valid("normal", "urgent").default("normal"),
});

const logFilePath = path.join(__dirname, process.env.dailyLogFilePath || 'logs/daily_transactions.json');
if (!fs.existsSync(path.dirname(logFilePath))) fs.mkdirSync(path.dirname(logFilePath));

function logTransaction(transaction) {
    try {
        const logData = fs.existsSync(logFilePath)
            ? JSON.parse(fs.readFileSync(logFilePath))
            : [];
        logData.push(transaction);
        fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error("Error logging transaction:", error);
    }
}

app.post('/pay-bill', async (req, res) => {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
        return res.status(400).send("Invalid input: " + error.details[0].message);
    }

    try {
        await paymentQueue.addPaymentRequest(value);
        logTransaction(value);
        res.status(200).send('Payment request added to queue.');
    } catch (err) {
        console.error("Error adding payment request:", err);
        res.status(500).send("Failed to add payment request.");
    }
});

app.get('/invoices/:userId', async (req, res) => {
    try {
        const invoices = await invoiceGenerator.getInvoices(req.params.userId);
        res.json(invoices);
    } catch (error) {
        console.error("Error retrieving invoices:", error);
        res.status(500).send("Error retrieving invoices.");
    }
});

app.post('/undo-transaction/:userId', async (req, res) => {
    try {
        const undoneTransaction = transactionStack.undoTransaction(req.params.userId);
        if (undoneTransaction) {
            res.status(200).send('Transaction undone successfully.');
        } else {
            res.status(404).send('No transactions to undo.');
        }
    } catch (err) {
        res.status(500).send('Error undoing transaction.');
    }
});

app.listen(process.env.port || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});