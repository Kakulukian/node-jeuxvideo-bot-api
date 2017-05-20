# Node.js Jeuxvideo.com Bot API

Node.js module to interact with unofficial Jeuxvideo.com Bot API. A jeuxvideo.com's account is needed, to obtain one, go on jeuxvideo.com.

## Install

```bash
npm install --save node-jeuxvideo-bot-api
```

## Usage

```js
const JvcBot = require('node-jeuxvideo-bot-api');

const bot = new JvcBot({
  topicURLWatcher: 'http://www.jeuxvideo.com/forums/42-51-50527051-1-0-1-0-mode-la-dictature-de-la-moderation.htm',
  username: 'MYUSERNAME',
  password: 'MYPASSWORD'
});

bot.on('ready', () => {
  bot.on('message', (msg) => {
    bot.sendMessage(`Hello ${msg.author} !`);
  });
});
```
## Options
| Param | Type | Default | Description |
| --- | --- | --- | --- |
| watchOnly | <code>Boolean</code> | False | True for only watch topics, False permits to post answer|
| username | <code>String</code> | Empty | Credentials for JVC|
| password | <code>String</code> | Empty | Credentials for JVC|
| topicURLWatcher | <code>String</code> | Empty | Topic url to be watched by bot|
| delayBetweenScrap | <code>Integer</code> | Empty | Delay between scrape in ms|
## License

**The MIT License (MIT)**

Copyright (c) 2017 Kakulukian
