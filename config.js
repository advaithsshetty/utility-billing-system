const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
    dailyLogFilePath: process.env.DAILY_LOG_FILE_PATH || 'logs/daily_transactions.json',
    monthlyLogDir: process.env.MONTHLY_LOG_DIR || 'logs/monthly/',
    invoiceDir: process.env.INVOICE_DIR || 'invoices/',
};