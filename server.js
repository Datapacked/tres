const IRC = require('irc-framework');

const sleeper = require('./sleeper');

const GAME = require('./game');

const express = require('express');
const app = express();

const JOIN_CODE = process.argv[2] ? process.argv[2] : "null"; // Gets join code from argv[2]

var CHANNEL = `#${JOIN_CODE}`; // Joins channel based on join code set by argv[2]

console.log(CHANNEL); // Prints out channel

// Connects bot to server with nickname
var bot = new IRC.Client();
bot.connect({
	host: '127.0.0.1',
	port: 6667,
	nick: 'server-' + JOIN_CODE
});

// On register stuff
var buffers = [];
bot.on('registered', function() {
	var channel = bot.channel(CHANNEL);
	buffers.push(channel);
	
	channel.join();
	channel.say('Hi!');
	
	channel.updateUsers(function() {
		console.log(channel.users);
	});
});

// Event for every message (disabled)
/* bot.on('message', function (event) {
  	if (event.message.indexOf('hello') === 0) {
  		event.reply('Hi!');
  	}
  	
  	if (event.message.match(/^!join /)) {
  		var to_join = event.message.split(' ')[1];
  		event.reply('Joining ' + to_join + '..');
  		bot.join(to_join);
	}
	if (event.message.indexOf("leave") === 0) {
		event.reply('okay');
		bot.quit();
		process.exit(0);
	}
}); */

const nGame = new GAME.Game(GAME.drawN(1, GAME.COLORS, GAME.IDS)[0]);

// Matches game commands
bot.matchMessage(/^GAME/, function (event) {
	const player_id = `${event.nick}_${event.ident}`;
	var msg = event.message;
	msg = msg.replace(/^GAME/, '').trim();
	if (msg.match(/^CURRCARD/)) {
		event.reply(JSON.stringify(nGame.cC));
	}
	if (msg.match(/^JOIN/)) {
		nGame.join(player_id);
	}
	if (msg.match(/^MYCARDS/)) {
		event.reply(JSON.stringify(nGame.getPCards(player_id)));
	}
	if (msg.match(/^DRAW/)) {
		nGame.draw(player_id);
	}
	if (msg.match(/^PLAY/)) {
		var N = Number(msg.replace(/^PLAY/, '').trim().match(/[0-9]+/)[0]);
		var status = nGame.play(player_id, N);
		switch (status) {
			case -2:
				event.reply(`REPLY ${player_id} INVALID TURN`);
				break;
			case -1:
				event.reply(`REPLY ${player_id} INVALID CARD`);
				break;
			case 0:
				event.reply(`REPLY ${player_id} SUCCESS`);
		}
	}
});

app.get("/example/:id", (req, res) => {
	var channel = bot.channel(CHANNEL);
	channel.join();
	channel.say(req.params.id);
	res.send({ status: "OK" });
	res.status(200);
});

app.listen(3000, () => {
	console.log(":3");
})