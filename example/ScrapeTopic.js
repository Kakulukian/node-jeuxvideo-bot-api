const Jvc = require('..');
const jvc = new Jvc();  

const scrapeTopic = (url) => {
    return new Promise((resolve, reject) => {
        jvc.getPostsFromTopic(url).then(function(posts) {
            if(posts.next.length !== 0) {
                resolve(scrapeTopic(posts.next));
            }
            console.log(posts);
        });
    });
};

scrapeTopic(process.argv[2]);