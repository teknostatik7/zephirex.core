# v2.0 Zephirex.Core | Node.js-based Coinbase PRO automated trading algorithm
Coinbase Pro Automated Trading Algorithm.

Robust and stable automated trading software, currently trades in small or large increments, safe parameters allow you to monitor each individual trade live. Reports are still in development and thus must be pulled directly from Coinbase Pro to affirm efficiency and monitor risk.

Important: To eliminate the need for tracking existing orders as well as providing the element of surprise, our software performs TAKER orders only, later versions will provide the option for MAKER orders and order management system.

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

v2.2 is currently under development but will introduce the advantage of delivering daily and weekly reports.
