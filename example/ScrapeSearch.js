const Jvc = require('..');
const jvc = new Jvc();  

const ANTI_SCRAPING_PROTECTION_DELAY = 5000;
const scrapeResearchKeyword = (url, keyword, mode) => {
    return new Promise((resolve, reject) => {
        jvc.getTopicsFromForumSearch(url, keyword, mode).then(function(topics) {
            if(topics.next.length !== 0) {
                setTimeout(() => {
                    resolve(scrapeResearchKeyword(topics.next, keyword, mode));
                }, ANTI_SCRAPING_PROTECTION_DELAY);
            }
            console.log(topics.topics.reduce((accumulator, currentValue) => {
                return {count: accumulator.count + currentValue.count};
            }));
        }).catch((err) => {
            console.log(err)
        });
    });
};

scrapeResearchKeyword(process.argv[2], process.argv[3], 0);