# medusa-plugin-moneyworks

This plugin aims to make synchronization between [MoneyWorks](https://www.cognito.co.nz/) and medusajs as simple as possible.

## Features

This plugin provides the following features

- [x] Synchronize inventory quantity from MoneyWorks
- [x] Synchronize SKU and barcode from MoneyWorks
- [x] Run synchronization with scheduled jobs
- [x] Emit event when invoice is ready

## Getting Started

To use this plugin, install it with your package manager

```
pnpm install @oak-digital/medusa-plugin-moneyworks
```

Add the plugin to the plugins array in your `medusa-config`

```javascript
const plugins = [
  // ...
  {
    resolve: "@oak-digital/medusa-plugin-moneyworks",
    options: {
      host: process.env.MW_HOST, // The hostname for your MoneyWorks datacentre
      port: process.env.MW_PORT, // The port for the REST api of your MoneyWorks datacentre
      username: process.env.MW_USERNAME, // The server username 
      password: process.env.MW_PASSWORD, // The server password
      dataFile: process.env.MW_DATA_FILE, // The path to the datafile, should not be url encoded
      dataFileUsername: process.env.MW_DATA_FILE_USERNAME,
      dataFilePassword: process.env.MW_DATA_FILE_PASSWORD,
      scheduledSyncString: "0 0 2 ? * * *", // a cron string for when the sync should run, default "0 0 2 ? * * *"
      moneyworksSecret: process.env.MW_SECRET, // A secret to use to make endpoints under /moneyworks work. Should be discussed with moneyworks.
      invoiceForm: process.env.MW_INVOICE_FORM, // Which form to use for the generated invoice (Optional)
      defaultContra: process.env.MW_CONTRA, // The contra field to use for transactions
      handlebars: Handlebars, // optional. If you want your own handlebars with helpers you can use this here
      transactionNameCodeTemplate: 'WEB_{{ shipping_address.country_code }}', // optional A handlebars template for the namecode on the transaction. Defaults to "WEB_ORDER"
      transactionStockLocationTemplate: '{{ order.shipping_address.country_code }}' // optional a handlebars template for stock location on line items with the order (key: order) and the line item (key: item) as the context
    }
  }
]
```

## Synchronization

To make synchronization work, the barcode or SKU should be set on a variant.
The synchronization will sync inventory quantity, SKU and barcode.

## Orders

Whenever an order is created in medusa it will be sent to MoneyWorks as a transaction.
Currently it is required to have a name in the names table of MoneyWorks with the namecode `WEB_ORDER`, which all transactions will be created to.

## Events

### `order.invoice.ready`

This event happens just after `order.placed`

~~This event happens when MoneyWorks sends a POST request to `/moneyworks/invoice-ready` with the following fields.~~ 

```ts
{
  orderId: number | string, // The display_id of the order
  invoiceId: number | string, // The id/sequencenumber of the invoice in moneyworks
}
```

Event data:

```ts
{
  invoice: string, // The invoice pdf as a base64 encoded string
  id: string, // The actual medusa order id (e.g. "order_...")
}
```

This event can be used in a notification provider to send a notification with the invoice to the customer.

This can be used as a fallback to send an email to the customer, just without an invoice.

### `order.invoice.failed`

If the invoice could not be fetched from MoneyWorks, this event will be fired instead of `order.invoice.ready`

Event data:

```ts
{
  id: string, // The medusa order id
  invoiceId: number, // The sequencenumber of the invoice that failed from MoneyWorks
}
```
