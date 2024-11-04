const fs = require('fs');
const path = require('path');
const config = require('./config');

const transactions = {};

function undoTransaction(userId) {
    if (transactions[userId] && transactions[userId].length > 0) {
        return transactions[userId].pop();
    }
    return null;
}

function archiveDailyLog() {
    const monthlyDir = config.monthlyLogDir;
    if (!fs.existsSync(monthlyDir)) fs.mkdirSync(monthlyDir, { recursive: true });

    const date = new Date();
    const archivePath = path.join(monthlyDir, `transactions-${date.getFullYear()}-${date.getMonth() + 1}.json`);
    if (fs.existsSync(config.dailyLogFilePath)) {
        fs.renameSync(config.dailyLogFilePath, archivePath);
    }
}

function getInvoices(userId) {
    const invoiceDir = config.invoiceDir;
    if (!fs.existsSync(invoiceDir)) return [];
    const files = fs.readdirSync(invoiceDir);
    return files.filter(file => file.startsWith(userId)).map(file => path.join(invoiceDir, file));
}

function pushTransaction(transaction) {
    if (!transactions[transaction.userId]) {
        transactions[transaction.userId] = [];
    }
    transactions[transaction.userId].push(transaction);
    logTransaction(transaction);
}

function logTransaction(transaction) {
    const logDir = path.dirname(config.dailyLogFilePath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    try {
        if (!fs.existsSync(config.dailyLogFilePath)) {
            fs.writeFileSync(config.dailyLogFilePath, JSON.stringify([]));
        } else {
            const fileContent = fs.readFileSync(config.dailyLogFilePath, 'utf8');
            if (fileContent.trim() === "") {
                fs.writeFileSync(config.dailyLogFilePath, JSON.stringify([]));
            }
        }

        const logData = JSON.parse(fs.readFileSync(config.dailyLogFilePath));
        logData.push(transaction);
        fs.writeFileSync(config.dailyLogFilePath, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error("Error logging transaction:", error);
    }
}

module.exports = { pushTransaction, undoTransaction, archiveDailyLog, getInvoices };