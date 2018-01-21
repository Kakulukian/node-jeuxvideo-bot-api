# Node.js Jeuxvideo.com Bot API

Node.js module to interact with unofficial Jeuxvideo.com Forum API. A jeuxvideo.com's account is needed, to post message on topic.

## Install

```bash
npm install --save node-jeuxvideo-bot-api
```

## Cheat Sheet

```js
const Jvc = require('node-jeuxvideo-bot-api');
```

### Authentification on JVC by credentials
```js
const jvc = new Jvc({
  username: 'MYUSERNAME',
  password: 'MYPASSWORD'
});

jvc.login().then( () => {
  // do stuff
}).catch(console.err);
```

### Authentification on JVC by cookie
```js
const jvc = new Jvc({
  loginFromCookies: {
    coniunctio: 'Coniunctio cookie value'
  }
});

jvc.login().then( () => {
  // do stuff
}).catch(console.err);
```

### Get common forums list
```js
jvc.getForumsList().then((forums) => {
  console.log(forums);
  /**
  * Displays
  * [
  *   {
  *     forumName: 'xxxx',
  *     forumUrl: 'xxxx'
  *   },
  *   {
  *     forumName: 'xxxx',
  *     forumUrl: 'xxxx'
  *   }
  * ]
  **/ 
}).catch(console.err);
```

### Get topics from forum url
```js
jvc.getTopicsFromForum('http://www.jeuxvideo.com/forums/0-3010442-0-1-0-1-0-football-manager-2018.htm').then((topics) => {
  console.log(topics);
  /**
  * Displays
  * {
  *   topics: [
  *     {
  *       id: '54842501'
  *       subject: 'Blabla'
  *       count: 12
  *       author: 'Blabla'
  *       pinned: false
  *       lastUpdate: '20/01/18'
  *       firstPageUrl: '/forums/xxxx.html'
  *       lastPageUrl: '/forums/xxxx.html'
  *     },
  *     ...
  *   ],
  *   next: '/forums/0-3010442-0-1-0-26-0-football-manager-2018.htm',
  *   previous: ''
  * }
  **/ 
}).catch(console.err);
```

### Get topics from forum url
```js
jvc.getTopicsFromForumSearch('http://www.jeuxvideo.com/forums/0-3010442-0-1-0-1-0-football-manager-2018.htm', 'game', 0).then((topics) => {
  console.log(topics);
  /**
  * Displays
  * {
  *   topics: [
  *     {
  *       id: '54842501'
  *       subject: 'gane ddfdf'
  *       count: 12
  *       author: 'Blabla'
  *       pinned: false
  *       lastUpdate: '20/01/18'
  *       firstPageUrl: '/forums/xxxx.html'
  *       lastPageUrl: '/forums/xxxx.html'
  *     },
  *     ...
  *   ],
  *   next: '/recherche/forums/0-3010442-0-1-0-26-0-football-manager-2018.htm',
  *   previous: ''
  * }
  **/ 
}).catch(console.err);
```

### Get posts from topic url
```js
jvc.getPostsFromTopic('http://www.jeuxvideo.com/forums/42-3010442-53927408-1-0-1-0-topic-de-moderation.htm').then((posts) => {
  console.log(posts);
  /**
  * Displays
  * {
  *   posts: [
  *     {
  *       id: '54842501'
  *       author: 'Blabla'
  *       pinned: false
  *       createdDate: '20 janvier 2018 à 21:01:01'
  *       content: 'Blabla blabla'
  *     },
  *     ...
  *   ],
  *   next: '/forums/42-3010442-53927408-2-0-1-0-topic-de-moderation.htm',
  *   previous: ''
  * }
  **/ 
}).catch(console.err);
```


### Send message on topic url
```js
jvc.sendMessage('Blablabla','http://www.jeuxvideo.com/forums/42-3010442-53927408-1-0-1-0-topic-de-moderation.htm').then(() => {
  //do stuff
}).catch(console.err);
```


## Options
| Param | Type | Default | Description |
| --- | --- | --- | --- |
| username | <code>String</code> | Empty | Username credential for JVC|
| password | <code>String</code> | Empty | Password credential for JVC|
| loginFromCookie | <code>Object</code> | {} | Connection cookie coniunctio, loginFromCookie.coniunctio: 'value'
## License

**The MIT License (MIT)**

Copyright (c) 2017 Kakulukian
