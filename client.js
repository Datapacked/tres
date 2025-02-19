const IRC = require('irc-framework');

const crypto = require('crypto');

const sleeper = require('./sleeper');

var CHANNEL = "#bruwuno69";

const HOST = process.argv[2] ? process.argv[2] : '127.0.0.1';
const PORT = 6667;

var ID = crypto.randomBytes(8).toString('hex');

var bot = new IRC.Client();
const OPTIONS = {
	host: HOST,
	port: PORT,
	nick: `client-${ID}`,
	ident: `${ID}`
};
console.log(OPTIONS);
bot.connect(OPTIONS);
const player_id = `${OPTIONS.nick}_${OPTIONS.ident}`

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

bot.on('message', function (event) {
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
});


// Or a quicker to match messages...
bot.matchMessage(/^hi/, function(event) {
	event.reply('hello there!');
});