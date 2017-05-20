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
  topicURLWatcher: 'forums/*.html',
  username: 'MYUSERNAME',
  password: 'MYPASSWORD'
});

bot.on('ready', () => {
  bot.on('message', (msg) => {
    bot.sendMessage(`Hello ${msg.author} !`);
  });
});
```

## License

**The MIT License (MIT)**

Copyright (c) 2017 Kakulukian
