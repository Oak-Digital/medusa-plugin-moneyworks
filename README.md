# medusa-plugin-moneyworks

This plugin aims to make synchronization between [MoneyWorks](https://www.cognito.co.nz/) and medusajs as simple as possible.

## Features

This plugin provides the following features

- [x] Synchronize inventory quantity from MoneyWorks
- [x] Synchronize SKU and barcode from MoneyWorks
- [x] Run synchronization with scheduled jobs

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
    }
  }
]
```

## synchronization

To make synchronization work, the barcode or SKU should be set on a variant.
The synchronization will sync inventory quantity, SKU and barcode.

## Orders

Whenever an order is created in medusa it will be sent to MoneyWorks as a transaction.
Currently it is required to have a name in the names table of MoneyWorks with the namecode `WEB_ORDER`, which all transactions will be created to.
