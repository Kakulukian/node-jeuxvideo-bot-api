const Jvc = require('..');

const DELAY_BETWEEN_POSTS = 34000;

const jvc = new Jvc({
  username: process.argv[2],
  password: process.argv[3]
});

jvc.login().then(() => {
  jvc.getTopicsFromForum(process.argv[4]).then((topics) => {
    let i = 0;
    for(let topic of topics) {
      if(!topic.pinned) {
        setTimeout(() => {
          console.log(`**** Send message on ${topic.subject} by ${topic.author} ****`);
          const rating = Math.floor(Math.random() * 11);
          jvc.sendMessage(`Coucou, je suis un bot et voilà ta note de topic ${rating} / 10 !`, topic.firstPageUrl).then().catch((err) => {
            console.log(err);
          });
        }, DELAY_BETWEEN_POSTS * i);
        i++;
      }
    }
  });
});
