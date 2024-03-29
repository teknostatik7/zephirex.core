# Zephirex CORE v2.0

## A Node.js-based automated trading algorithm for Coinbase PRO wallets
Robust and stable automated trading software, currently trades in small or large increments, safe parameters allow you to monitor each individual trade live. Reports are still in development and thus must be pulled directly from Coinbase Pro to affirm efficiency and monitor risk.

Important: To eliminate the need for tracking existing orders as well as providing the element of surprise, our software performs TAKER orders only, later versions will provide the option for MAKER orders and order management system.

## Instructions
- Create Coinbase Pro API key with **View** and **Trade** permissions *ONLY* and whitelist host IP address.
- Configuration in app.js serves the following usages:
    1. E-mail notification to text via phone's service-provider email address, as well as by authenticated email service like Gmail.
    2. Coinbase PRO API keys to authorize trading algorithm to perform trades.
    3. Specify currency pairs the software will monitor via websocket.
   
   
## Requirements
- Node.JS
- NPM
- PM2 for monitoring and reporting.
- coinbase-pro NPM
- nodemailer NPM

## Features
v2.2 is currently under development but upon completion; it will introduce the advantage of delivering daily and weekly reports.
- [x] Email to Text notifications - *v2.0*
- [ ] Daily and/or weekly reports delivered by email-to-text *v2.2*

## Installation
```
npm install zephirex-core
```
