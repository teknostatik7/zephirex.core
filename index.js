#!/usr/bin/env node
process.env.UV_THREADPOOL_SIZE = 128;

window = {};

window.xFactor = .75;
window.minMultiplier = 1;
window.fee = 0.005;
window.Pairs = [];
window.balances = [];
window.balanceSheet = '';
window.delayMs = 1000;
window.ws_disable = 0;

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: [SENDER_EMAIL_ADDRESS],
    pass: [SENDER_EMAIL_PASSWORD]
  }
});

function sendEmail(x, price){
	var sideIcon = (x.side == 'buy' ? '🔵' : '🔴');
	var msg = sideIcon + ' ' + x.product_id + ': ' + (x.size == null? x.funds / price : x.size) + ' @ ' + price;
	var mailOptions = {
	  from: SENDER_EMAIL_ADDRESS,
	  to: RECIPIENT_EMAIL_ADDRESS,
	  text: msg,
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log("sendMail error: ", error);
	  } else {
	    console.log(msg);
	  }
	});
}

const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();

const key = API_KEY;
const secret = API_SECRET;
const passphrase = API_PASSPHRASE;

const apiURI = 'https://api.pro.coinbase.com';
const sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';

const authedClient = new CoinbasePro.AuthenticatedClient(
  key,
  secret,
  passphrase,
  apiURI
);

const Coins = {
	"USD" : [
		"BTC",
		"ETH",
		"ZRX",
		"LTC"
	],
	"BTC" : [
		'ETH',
		'ZRX',
		'LTC',
	]
}

function assembler(){
	for (var base in Coins) {
		for (var i = 0; i < Coins[base].length; i++) {
			var quote = Coins[base][i];
			var pair = quote+"-"+base;
			window.Pairs[pair] = new Market(quote, base);
		}
	}
	console.log("Pairs have been assembled.")
}

function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}

function getBalances(){
	return new Promise(resolve => {
		console.log("Commence balance update")
		var accounts = authedClient.getAccounts();
		accounts.then(function(jsObjects) {
			let results = jsObjects.filter(obj => {
			  return obj.available > 0;
			})
			//console.log(results);
			for (var i = 0; i < results.length; i++) {
				asset = results[i];
				window.balances[asset.currency] = asset.available;
				window.balanceSheet += asset.currency + ": " + asset.available + '\r';
				//console.log(asset.currency + " available: " + asset.available);
			}
			resolve('== Balances updated ==');
		}).catch(err => {
			console.log("Get balances error:");
			console.log(err);
		});
	})
}

function f(r,t){
	//console.log("Calculating... " + r + " & " + t)
	return r * r * (t - 2 * Math.sin(t) + (1/2) * t + (1/4) * Math.sin(2 * t));
}

// Market Object

function Market(quoteName, baseName){
	this.name = quoteName + "-" + baseName;
	this.baseName = baseName;
	this.quoteName = quoteName;
	this.quoteBalance = window.balances[this.quoteName];
	this.baseBalance = window.balances[this.baseName];
	console.log(this.baseName + " balance: " + Coins[this.baseName].length)
	this.minQuote = null;
	this.minBase = null;
	this.disable = 0;

	this.calculate = function(balance, close, open, precision){

		var r = parseFloat(window.xFactor * Math.sqrt((2*balance)/Math.PI)).toFixed(8);
		var t = Math.PI;

		var maxTotalArea = parseFloat(2 * r * r * t).toFixed(8); // 2πr²
		var percentChange = (close - open) / open;

		var maxSectionArea = parseFloat(2 * r * r * Math.abs(percentChange) * Math.PI).toFixed(8);

		var t2 = parseFloat((1 - Math.abs(percentChange)) * t).toFixed(8);

		//console.log(r);
		var fullArea = f(r, t);
		var stop = f(r, t2);
		var differenceArea = Number(fullArea - stop - maxSectionArea);

		return parseFloat(differenceArea * window.minMultiplier).toFixed(precision);
	}
}

const websocket = new CoinbasePro.WebsocketClient(['BTC-USD', 'ETH-USD', 'ZRX-BTC', 'ETH-BTC', 'ZRX-USD', 'LTC-USD', 'LTC-BTC']);

websocket.on('message', data => {
  /* work with data */
  if(data.type == "ticker"){
  	/// Ticker logic here
  	var pair = data.product_id;
		if(window.Pairs[pair].lowestAsk == null){window.Pairs[pair].lowestAsk = data.best_ask * (1-window.fee); window.Pairs[pair].tempLowestAsk = data.best_ask * (1-window.fee)};
		if(window.Pairs[pair].highestBid == null){window.Pairs[pair].highestBid = data.best_bid / (1-window.fee); window.Pairs[pair].tempHighestBid = data.best_bid / (1-window.fee)};

		if(data.best_ask < window.Pairs[pair].tempLowestAsk){
			window.Pairs[pair].tempLowestAsk = data.best_ask;

			//    *********** BUY LOGIC **********
			var basePortion = window.Pairs[pair].calculate(window.Pairs[pair].baseBalance, data.best_ask, window.Pairs[pair].lowestAsk, decimalPlaces(window.Pairs[pair].minBase));
			console.log(' - ' , pair, data.best_ask);
			if(basePortion >= window.Pairs[pair].minBase && window.ws_disable == 0){
				window.ws_disable = 1;
				console.log("🔵 >>> Time to BUY " + pair + " @ " + data.best_ask);
				// Once trade is complete: Disable the disable and set low/high to data ask/bid.
				var buyParams = {
					type: 'market',
					side: 'buy',
				  funds: basePortion, // USD
				  product_id: pair,
				  time_in_force: 'IOC',
				};
	  		console.log(buyParams);
	  		authedClient.buy(buyParams)
	  			.then(async function (result){
	  				console.log(result);
	  				sendEmail(result, data.best_ask);
						var bal = await getBalances();
						window.Pairs[pair].lowestAsk = data.best_ask;
	  			})
	  			.catch(error => {
	  				console.log(error);
	  			})
	  		setTimeout(function(){window.ws_disable = 0}, window.delayMs);
			}
		}if(data.best_bid > window.Pairs[pair].tempHighestBid){
			window.Pairs[pair].tempHighestBid = data.best_bid;

			//    *********** SELL LOGIC **********
	  	var quotePortion = window.Pairs[pair].calculate(window.Pairs[pair].quoteBalance, data.best_bid, window.Pairs[pair].highestBid, decimalPlaces(window.Pairs[pair].minQuote));
			console.log(' + ' , pair, data.best_bid);
	  	if(quotePortion >= window.Pairs[pair].minQuote && window.ws_disable == 0){
				window.ws_disable = 1;
				console.log("🔴 >>> Time to SELL " + pair + " @ " + data.best_bid);
				// Once trade is complete: Disable the disable and set low/high to data ask/bid.
				var sellParams = {
					type: 'market',
					side: 'sell',
				  size: quotePortion, // BTC
				  product_id: pair,
				  time_in_force: 'IOC',
				};
				console.log(sellParams);
				authedClient.sell(sellParams)
					.then(async function (result){
						console.log(result);
	  				sendEmail(result, data.best_bid);
						var bal = await getBalances();
						window.Pairs[pair].highestBid = data.best_bid;
					})
					.catch(error => {
						console.log(error);
					})
	  		setTimeout(function(){window.ws_disable = 0}, window.delayMs);
			}
		}
  }
  else if(data.type == "status"){
		for (var pair in window.Pairs){
			for (var x = 0; x < data.products.length; x++){
				if (data.products[x].id == pair){
					window.Pairs[pair].minQuote = Number(data.products[x].base_min_size);
					window.Pairs[pair].minBase = Number(data.products[x].min_market_funds);
				}
			}
		}
  /*}else if(data.type == "heartbeat"){
  	console.log("❤: " + data.time);*/
  }
});
websocket.on('error', err => {
  /* handle error */
});
websocket.on('open', () => {
  console.log(" +++ Websocket Open +++ ");
	websocket.subscribe({ product_ids: ['BTC-USD', 'ETH-USD', 'ZRX-BTC', 'ETH-BTC', 'ZRX-USD', 'LTC-USD', 'LTC-BTC'], channels: ['ticker', 'user', 'status'] });
	var mailOptions = {
	  from: SENDER_EMAIL_ADDRESS,
	  to: RECIPIENT_EMAIL_ADDRESS,
	  text: 'Websocket open! \r\n' + window.balanceSheet,
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
});
websocket.on('close', () => {
  console.log("*** Websocket Has Closed ***");
	websocket.subscribe({ product_ids: ['BTC-USD', 'ETH-USD', 'ZRX-BTC', 'ETH-BTC', 'ZRX-USD', 'LTC-USD', 'LTC-BTC'], channels: ['ticker', 'user', 'status'] });
});

async function director(){
	console.log('Director initiated!');
	var balances = await getBalances();
	console.log(balances);
	assembler();
	const websocket = new CoinbasePro.WebsocketClient(['BTC-USD']);
}

director();
