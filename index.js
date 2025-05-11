// invoice-cli-qbo.js
import readline from 'readline';

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'; // <-- Replace this
const REALM_ID = 'YOUR_REALM_ID'; // <-- Replace this

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('=== QuickBooks Invoice Generator ===');

  const invoice = {
    Line: [],
    CustomerRef: {}
  };

  const customerName = await ask('Customer Name: ');
  const customerId = await ask('Customer ID (QuickBooks internal ID): ');

  invoice.CustomerRef = {
    value: customerId,
    name: customerName
  };

  let addingItems = true;
  while (addingItems) {
    const description = await ask('Item Description: ');
    const quantity = await ask('Quantity: ');
    const unitPrice = await ask('Unit Price: ');

    invoice.Line.push({
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
    });

    const addMore = await ask('Add another item? (yes/no): ');
    if (addMore.toLowerCase() !== 'yes') {
      addingItems = false;
    }
  }

  const invoiceData = {
    CustomerRef: invoice.CustomerRef,
    Line: invoice.Line
  };

  console.log('\nSending Invoice to QuickBooks...');

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
    console.log('✅ Invoice Created Successfully!');
    console.log('Invoice ID:', data.Invoice.Id);
  } else {
    console.error('❌ Error Creating Invoice:');
    console.error(JSON.stringify(data, null, 2));
  }

  rl.close();
}

main();

