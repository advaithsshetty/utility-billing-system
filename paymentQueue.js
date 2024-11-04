const Queue = require('queue-fifo');
const transactionStack = require('./transactionStack');
const invoiceGenerator = require('./invoiceGenerator');

const normalQueue = new Queue();
const priorityQueue = new Queue();
const CONCURRENT_LIMIT = 3;
let activeTasks = 0;

async function processPayment(paymentRequest) {
    try {
        const invoicePath = await invoiceGenerator.generateInvoice(paymentRequest);
        paymentRequest.invoicePath = invoicePath;

        transactionStack.pushTransaction(paymentRequest);
        console.log(`Processed payment for ${paymentRequest.userId}: ${paymentRequest.amount}`);
    } catch (error) {
        console.error("Error processing payment:", error);
        throw error;
    }
}

async function processPayments() {
    if (activeTasks >= CONCURRENT_LIMIT) return;

    const request = !priorityQueue.isEmpty() ? priorityQueue.dequeue() : normalQueue.dequeue();
    if (request) {
        activeTasks++;
        await processPayment(request);
        activeTasks--;
        setImmediate(processPayments);
    }
}

function addPaymentRequest(paymentRequest) {
    (paymentRequest.urgency === "urgent" ? priorityQueue : normalQueue).enqueue(paymentRequest);
    processPayments();
}

module.exports = { addPaymentRequest };