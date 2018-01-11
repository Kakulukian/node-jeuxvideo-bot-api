const JVCBot = require('..');
const bot = new JVCBot({
  mode: 'forum',
  forumURLWatcher: process.argv[2],
  watchOnly: true,
  delayBetweenScrap: 5000,
});

bot.on('ready', () => {
	bot.on('topic', (topic) => {
		console.log(topic);
	});
});