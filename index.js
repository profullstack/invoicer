// invoice-cli-qbo.js
import readline from 'readline';
import logger from './logger.js';

logger.info('Initializing invoicer module');

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'; // <-- Replace this
const REALM_ID = 'YOUR_REALM_ID'; // <-- Replace this

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  logger.debug('Asking question:', question);
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  logger.info('=== QuickBooks Invoice Generator ===');

  const invoice = {
    Line: [],
    CustomerRef: {}
  };
  
  logger.debug('Invoice object initialized');

  const customerName = await ask('Customer Name: ');
  const customerId = await ask('Customer ID (QuickBooks internal ID): ');

  invoice.CustomerRef = {
    value: customerId,
    name: customerName
  };
  
  logger.debug('Customer reference set:', invoice.CustomerRef);

  let addingItems = true;
  while (addingItems) {
    const description = await ask('Item Description: ');
    const quantity = await ask('Quantity: ');
    const unitPrice = await ask('Unit Price: ');

    const lineItem = {
      Amount: Number(quantity) * Number(unitPrice),
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: {
          value: "1", // assuming "1" is a default item, or you can ask
          name: description
        },
        Qty: Number(quantity),
        UnitPrice: Number(unitPrice)
      },
      Description: description
    };
    
    logger.debug('Adding line item:', lineItem);
    invoice.Line.push(lineItem);

    const addMore = await ask('Add another item? (yes/no): ');
    if (addMore.toLowerCase() !== 'yes') {
      addingItems = false;
    }
  }

  const invoiceData = {
    CustomerRef: invoice.CustomerRef,
    Line: invoice.Line
  };

  logger.info('\nSending Invoice to QuickBooks...');
  logger.debug('Invoice data:', invoiceData);

  try {
    const response = await fetch(`https://sandbox-quickbooks.api.intuit.com/v3/company/${REALM_ID}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    const data = await response.json();

    if (response.ok) {
      logger.info('✅ Invoice Created Successfully!');
      logger.info('Invoice ID:', data.Invoice.Id);
    } else {
      logger.error('❌ Error Creating Invoice:');
      logger.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    logger.error('Failed to send invoice to QuickBooks:', error);
  }

  logger.debug('Closing readline interface');
  rl.close();
}

logger.info('Starting invoicer application');
main().catch(error => {
  logger.error('Unhandled error in main function:', error);
});

