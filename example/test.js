const JVCBot = require('..');

const bot = new JVCBot({
  topicURLWatcher: 'http://www.jeuxvideo.com/forums/42-51-50527051-1-0-1-0-mode-la-dictature-de-la-moderation.htm',
  watchOnly: true
});
bot.on('ready', () => {
  console.log('Bot launched ...');
  bot.on('message', (message) => {
    console.log(message);
  });
});

