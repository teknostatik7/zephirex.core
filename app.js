#!/usr/bin/env node
process.env.UV_THREADPOOL_SIZE = 128;

// Initiate variables.
window = {};
window.Pairs = [];
window.balances = [];
window.balanceSheet = '';

window.config = {
	senderEmailService: 'gmail',
	senderEmail: 'sender_email_address',
	senderEmailPassword: 'sender_email_password',
	recipientEmail: 'notification_recipient_email_address',
	passphrase: 'coinbase_pro_API_PASSPHRASE',
	secret: 'coinbase_pro_API_SECRET',
	key: 'coinbase_pro_API_KEY',
};

window.xFactor = .7; 			// Balance usage strength percentage 0 - 1 ; 1 = 100%
window.minMultiplier = 1.2; 		// Minimum purchase multiplier
window.fee = 0.0095; 			// Imaginary fee ; higher == low risk ; lower == more frequent trades. i.e 0.95% fee
window.delayMs = 1000;			// Allow 1000 ms between trades to avoid limit

// Pairs the websocket analizes for trading.
window.pairs = [
	'BTC-USD',
	'ETH-USD',
	'ZRX-BTC',
	'ETH-BTC',
	'ZRX-USD',
	'LTC-USD',
	'LTC-BTC',
];

const CoinbasePro = require('coinbase-pro');
const transporter = require('transporter');
const director = require('director');
const publicClient = require('publicClient');
const websocket = require('websocket');

director();
