const IRC = require('irc-framework');

const GAME = require('./game');

const express = require('express');
const app = express();

const JOIN_CODE = process.argv[2] ? process.argv[2] : "null"; // Gets join code from argv[2]

const CHANNEL = `#${JOIN_CODE}`; // Joins channel based on join code set by argv[2]

console.log(CHANNEL); // Prints out channel

msleep = (n) => {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

sleep = (n) => msleep(1000 * n);

// Connects bot to server with nickname
var bot = new IRC.Client();
bot.connect({
	host: '127.0.0.1',
	port: 6667,
	nick: 'server-' + JOIN_CODE
});

// On register stuff
var buffers = [];
bot.on('registered', function () {
	var channel = bot.channel(CHANNEL);
	buffers.push(channel);

	channel.join();
	channel.say('Hi!');

	channel.updateUsers(function () {
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

const nGame = new GAME.Game(new GAME.Card(GAME.COLORS.red, GAME.IDS.seven));

// Matches game commands
bot.matchMessage(/^GAME/, function (event) {
	// sets player ID to the nick and identifier of the author of the message
	const player_id = `${event.nick}_${event.ident}`;
	// msg content
	var msg = event.message;
	// sets msg content to be that of everything but the first 4 characters ("GAME") and trimmed
	msg = msg.replace(/^GAME/, '').trim();
	// Sends current card
	if (msg.match(/^CURRCARD/)) {
		event.reply(JSON.stringify(nGame.cC));
	}
	// Joins with player ID
	if (msg.match(/^JOIN/)) {
		let pTurn = nGame.join(player_id);
		event.reply(`REPLY ${player_id} TURNIDX ${pTurn}`);
	}
	// Gets turn (no auth or anything needed)
	if (msg.match(/^TURN/)) {
		event.reply(`REPLY TURN ${nGame.getTurn()}`);
	}
	// Returns the cards of the command invoker (if they don't exist the game/server crashes)
	if (msg.match(/^MYCARDS/)) {
		event.reply(JSON.stringify(nGame.getPCards(player_id)));
	}
	// Draws a card
	if (msg.match(/^DRAW/)) {
		nGame.draw(player_id);
	}
	// Plays card if it is the player's turn (turn announcement will be separately handled to make server-side processing less intensive)
	if (msg.match(/^PLAY/)) {
		var N = Number(msg.replace(/^PLAY/, '').trim().match(/[0-9]+/)[0]);
		var color = null;
		if (!(msg.match(/WILD\s[a-z]*/) === null)) {
			color = msg.match(/WILD\s[a-z]*/)[0].replace("WILD", "").trim();
		}
		var status = nGame.play(player_id, N);
		nGame.setWild(color);
		// Switch and cases are self-explanatory
		switch (status) {
			case -2:
				event.reply(`REPLY ${player_id} INVALID TURN`);
				break;
			case -1:
				event.reply(`REPLY ${player_id} INVALID CARD`);
				break;
			case 0:
				event.reply(`REPLY ${player_id} SUCCESS`);
				event.reply(`REPLY TURN ${nGame.getTurn()}`);
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