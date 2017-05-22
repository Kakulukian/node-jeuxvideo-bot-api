const JVCBot = require('..');
const bot = new JVCBot({
  topicURLWatcher: process.argv[2],
  username: process.argv[3],
  password: process.argv[4],
  delayBetweenScrap: 5000,
});

const command = ['/info', '/risitas', 'ddb'];
const users = [];
let messageProcessed = 0;
let userRating = {};
let recurrentMessage = '';
bot.on('ready', () => {
  const launchingTime = Math.floor(Date.now() / 1000);
  console.log('Bot ready...');
  setInterval(() => {
    if(recurrentMessage != ''){
      bot.sendMessage(recurrentMessage);
      recurrentMessage = '';
    } else {
      console.log('[WARN] No new message.')
    }
  }, 20000);
  bot.on('message', (message) => {
    messageProcessed++;
    console.log(`[INFO] New message. \n Currently ${messageProcessed} message processed.`);
    if (users.indexOf(message.author.toLowerCase()) === -1) {
      users.push(message.author.toLowerCase());
    }
    if (message.message.toLowerCase().indexOf(command[0]) > -1 && message.message.indexOf(process.argv[3]) == -1) {
      console.log('[INFO] Command /info detected.');
      bot.sendMessage(`----------------------\n 
        Robot lancé depuis ${Math.floor(Date.now() / 1000) - launchingTime} secondes. \n
        Commande /info exécutée par ${message.author}. \n
        Pour l'instant, il y a ${users.length} différents utilisateurs qui ont posté sur le topic. \n
        Bisous \n
        ----------------------`);
    } else if (message.message.toLowerCase().indexOf(command[1]) > -1) {
      console.log('[INFO] Command /risitas detected.');
      bot.sendMessage(`http://image.noelshack.com/fichiers/2016/30/1469541952-risitas182.png`);
    } else if (message.message.toLowerCase().indexOf(command[2]) > -1) {
      console.log('[INFO] ddb detected.');
      bot.sendMessage(`DDB envoyée ${message.author} :)`);
    } else {
      console.log('[INFO] Normal Message.');
      const rating = Math.floor(Math.random() * 11);
      if(userRating[message.author] && userRating[message.author].count === 0){
        userRating[message.author].count++;
        recurrentMessage += `${message.author} :d) Revoilà ta note : ${userRating[message.author].rating} / 10 :noel: \n`;
      } else {
        userRating[message.author].rating = rating;
        userRating[message.author].count = 0;
        recurrentMessage += `${message.author} :d) ${rating} / 10 \n`;
      }
    }
  });
});
