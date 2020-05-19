# zephirex.core
Coinbase Pro Trading bot

Very early stages of development, currently trades in small increments and reports are pulled separately for confirmation that the program is creating a profit.

Instructions:

- Create Coinbase Pro API key with View and Trade permissions ONLY and whitelist host IP address.
- Configuration in app.js serves the following usages:
    1. E-mail notification to text via phone's service-provider email address, as well as by authenticated email service like Gmail.
    2. Coinbase PRO API keys to authorize trading algorithm to perform trades.
    3. Specify currency pairs the software will monitor via websocket.
   
   
Requirements:

- Node.JS
- NPM
- PM2 for monitoring and reporting.
- coinbase-pro NPM
- nodemailer NPM
