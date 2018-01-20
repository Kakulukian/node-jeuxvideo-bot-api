const Jvc = require('..');

const DELAY_BETWEEN_POSTS = 11000;

const jvc = new Jvc({
  username: process.argv[2],
  password: process.argv[3],
});

let topicsNotProcessed = [];

/*jvc.getForumsList().then((forumsList) => {
  console.log(`**** RateBot loaded on ${forumsList[0].forumName} ****`);
  jvc.getTopicsFromForum(forumsList[0].forumUrl).then((topics) => {
    let i = 0;
    for(let topic of topics) {
      if(!topic.pinned) {
          setTimeout(() => {
            console.log(`**** Send message on ${topic.subject} by ${topic.author} ****`);
            jvc.sendMessage('Coucou, je suis BotMiguel !', topic.firstPageUrl).then().catch((err) => {
              topicsNotProcessed.push(topic.firstPageUrl);
            }, DELAY_BETWEEN_POSTS * i);
        });
        i++;
      }
    }
  });
});*/

jvc.getTopicsFromForum('http://www.jeuxvideo.com/forums/0-31654-0-1-0-1-0-wii-sports-club.htm').then((topics) => {
  let i = 0;
  for(let topic of topics) {
    if(!topic.pinned) {
        setTimeout(() => {
          console.log(`**** Send message on ${topic.subject} by ${topic.author} ****`);
          jvc.sendMessage('Coucou, je suis BotMiguel !', topic.firstPageUrl).then().catch((err) => {
            topicsNotProcessed.push(topic.firstPageUrl);
          }, DELAY_BETWEEN_POSTS * i);
      });
      i++;
    }
  }
});
