const Promise = require('bluebird');
const request = require('request-promise');
const crypto = require('crypto');
const moment = require('moment');
const cheerio = require('cheerio');

const Constants = require('./Constants');

class JVC {
  constructor(options) {
    if (!options) options = {};
    this.options = {};
    this.options.username = options.username || '';
    this.options.password = options.password || '';
    this.options.loginFromCookie = options.loginFromCookie || {};
    this.cookieJar = request.jar();
    this.logged = false;
    if (this.options.username.length > 0 && this.options.password.length > 0 || this.options.loginFromCookie.coniunctio) {
      this._login().then();
    }
  }

  /**
  * Get forum list provided by jvc (it's generalist forums)
  * @return {Promise}
  */
  getForumsList() {
    return new Promise((resolve, reject) => {
      this._request('/forums.htm').then((forumsPage) => {
        if (forumsPage) {
          const $ = cheerio.load(forumsPage, { ignoreWhitespace: true });
          const forumsList = [];
          $('a').each((i, elt) => {
            elt = $(elt);
            const forumUrl = elt.attr('href');
            if (Constants.FORUMS_LIST_REGEX.test(forumUrl)) {
              forumsList.push({
                forumName: elt.text(),
                forumUrl
              });
            }
          });
          resolve(forumsList);
        } else {
          reject('[ERROR] Unknown error.');
        }
      }).catch((err) => {
          if (err) reject(err);
        });
    });
  }

  /**
  * Get topics list from a given forum
  * @param  {String} - URL or path of JVC forum
  * @return {Promise}
  */
  getTopicsFromForum(forumUrl) {
    return new Promise((resolve, reject) => {
      forumUrl = this._convertURLToPath(forumUrl);
      if (forumUrl === null) reject('[ERROR] It\'s not a jvc forum url.');
      this._request(forumUrl).then((topicsPage) => {
        if (topicsPage) {
          const $ = cheerio.load(topicsPage, { ignoreWhitespace: true });
          const topicList = [];
          $(Constants.TOPICS_LIST_SELECTOR.ALL).each((i, elt) => {
            elt = $(elt);
            const subject = elt.find(Constants.TOPICS_LIST_SELECTOR.SUBJECT);
            const count = parseInt(elt.find(Constants.TOPICS_LIST_SELECTOR.COUNT).text());
            const firstPageUrl = subject.attr('href');
            const lastPageUrl = this._createMaxPageURL(firstPageUrl, count);
            topicList.push({
              id: elt.attr('data-id'),
              subject: subject.attr('title'),
              count,
              author: elt.find(Constants.TOPICS_LIST_SELECTOR.AUTHOR).text().replace(Constants.WHITESPACE_REMOVER, ''),
              pinned: Constants.TOPICS_LIST_COMPARATOR.PINNED.test(elt.find(Constants.TOPICS_LIST_SELECTOR.PINNED).attr('src')),
              lastUpdate: elt.find(Constants.TOPICS_LIST_SELECTOR.LAST_UPDATE).text().replace(Constants.WHITESPACE_REMOVER, ''),
              firstPageUrl,
              lastPageUrl
            });
          });
          resolve(topicList);
        } else {
          reject('[ERROR] Unknown error.');
        }
      }).catch((err) => {
          if (err) reject(err);
        });
    });
  }

  /**
  * Get posts from a given topic
  * @param  {String} - URL or path to a jvc topic
  * @return {Promise}
  */
  getPostsFromTopic(topicUrl) {
    return new Promise((resolve, reject) => {
      topicUrl = this._convertURLToPath(topicUrl);
      if (topicUrl === null) reject('[ERROR] It\'s not a jvc forum url.');

      this._request(topicUrl).then((postsPage) => {
        if (postsPage) {
          const $ = cheerio.load(postsPage, { ignoreWhitespace: true });
          const topic = {
            posts: [],
            previous: '',
            next: ''
          };
          const pagination = {
            previous: $(Constants.POSTS_LIST_SELECTOR.PAGE.CURRENT).first().prev().find(Constants.POSTS_LIST_SELECTOR.PAGE.LINK)
              .attr('href'),
            next: $(Constants.POSTS_LIST_SELECTOR.PAGE.CURRENT).first().next().find(Constants.POSTS_LIST_SELECTOR.PAGE.LINK)
              .attr('href')
          };
          if (pagination.previous) {
            topic.previous = pagination.previous;
          }
          if (pagination.next) {
            topic.next = pagination.next;
          }

          $(Constants.POSTS_LIST_SELECTOR.POST.ALL).each((i, elt) => {
            elt = $(elt);
            topic.posts.push({
              id: elt.attr('data-id'),
              author: elt.find(Constants.POSTS_LIST_SELECTOR.POST.AUTHOR).attr('alt'),
              createdDate: elt.find(Constants.POSTS_LIST_SELECTOR.POST.CREATED_DATE).text(),
              content: elt.find(Constants.POSTS_LIST_SELECTOR.POST.CONTENT).text()
            });
          });
          resolve(topic);
        } else {
          reject('[ERROR] Unknown error.');
        }
      }).catch((err) => {
          if (err) Promise.reject(err);
        });
    });
  }

  /**
  * Send message to a given topic (needs auth)
  * @param  {String} - Message to send
  * @param  {String} - Topic URL or path
  * @param  {Boolean} - Check topic id to avoid faulty topic id from url 
  * @return {Promise}
  */
  sendMessage(message = '', topicUrl = '', fullCheck = false) {
    return new Promise((resolve, reject) => {
      topicUrl = this._convertURLToPath(topicUrl);
      if (topicUrl === null) reject('[ERROR] It\'s not a jvc forum url.');
      if (!this.logged) reject('[ERROR] You need to login in order to use sendMessage function.');
      if (!message || message.length === 0) reject('[ERROR] It need a message which is not empty.');

      this._convertTopicUrlToTopicID(topicUrl, fullCheck).then((topicId) => {
        this._request(`forums/create_message.php?id_topic=${topicId}`, null, true).then((messagePage) => {
          if (messagePage) {
            const $ = cheerio.load(messagePage, { ignoreWhitespace: true });
            if(!this._checkSameForumReferer(topicUrl, $('.lien-languette').first().attr('href'))) {
              return this.sendMessage(message, topicUrl, true);
            }
            const payload = {};
            const inputs = $('.form-post-msg').find('input');
            inputs.each(function () {
              payload[$(this).attr('name')] = $(this).attr('value');
            });
            payload.message_topic = message;
            this._request(`forums/create_message.php?id_topic=${topicId}`, payload, true).then((creationPage) => {
              if (creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.AUTH) > -1
                  || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.CAPTCHA) > -1
                  || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.UNKNOWN_ERROR) > -1
                  || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.LOCK) > -1) {
                reject('[ERROR] Post in the topic failed. Reason : maybe you are not connected or delay between two posts is too small ...');
              }
              resolve();
            });
          } else {
            reject('[ERROR] Unknown error.');
          }
        }).catch((err) => {
            if (err) reject(err);
        });
      });
    });
  }

  _login() {
    return new Promise((resolve, reject) => {
      const ctx = this;
      if (this.options.loginFromCookie.coniunctio) {
        const loginCookie = request.cookie(`coniunctio=${this.options.loginFromCookie.coniunctio}`);
        this.cookieJar.setCookie(loginCookie, Constants.BASE_API_JVC_FORUM_URL);
        // check if really connected
        this._request(Constants.CHECK_LOGIN_PATH, null, true).then((newTopicPage) => {
          if (newTopicPage.indexOf(Constants.NOT_LOGGED_MESSAGE) > -1) {
            reject('[ERROR] Login by cookies failed, maybe you put the bad value of coniunctio cookie.');
          }
          ctx.logged = true;
          resolve();
        }).catch((err) => {
          if (err) reject(err);
        });
      }
      if (this.options.username && this.options.password) {
        this._request('accounts/login', { alias: this.options.username, password: this.options.password }, false, true).then(() => {
          ctx.logged = true;
          resolve();
        }).catch((err) => {
          if (err) reject(err.body.message);
        });
      }
    });
  }

  /**
     * Http call Jeuxvideo.com
     * @param  {String} path
     * @param  {Object} data to post
     * @return {String} Response
     */
  _request(path, data, forumApi = false, pureApi = false) {
    const options = {
      jar: this.cookieJar,
      followRedirect: true,
      followAllRedirects: true,
      headers: {
        'Cache-Control': 'no-cache'
      },
      timeout: 1500,
    };
    options.method = data ? 'POST' : 'GET';
    const baseUrl = forumApi ? Constants.BASE_API_JVC_FORUM_URL : (pureApi) ? Constants.BASE_API_JVC_URL : Constants.BASE_JVC_URL;
    options.url = baseUrl + path;
    if (forumApi || !forumApi && !pureApi) options.form = data;
    if (pureApi) {
      const timestamp = moment(Date.now()).format('YYYY-MM-DD\THH:mm:ss+00:00');
      const method = data ? 'POST' : 'GET';
      let signature = `550c04bf5cb2b\n${timestamp}\n${method}\napi.jeuxvideo.com\n/v4/${path}\n`;
      const salt = 'd84e9e5f191ea4ffc39c22d11c77dd6c';
      signature = crypto.createHmac('sha256', salt).update(signature).digest('hex');
      const headers = `PartnerKey=550c04bf5cb2b, Signature=${signature}, Timestamp=${timestamp}`;
      options.headers = {
        'User-Agent': 'JeuxVideo-Android/202',
        'Content-Type': 'application/json',
        'Jvc-Authorization': headers
      };
      options.json = true;
      options.body = data;
    }
    return new Promise((resolve, reject) => {
      request(options).then((resp) => {
        resolve(resp);
      }).catch((error) => {
        if (error.response) reject(error.response);
      });
    });
  }

  _convertTopicUrlToTopicID(topicUrl = '', fullCheck = false) {
    return new Promise((resolve, reject) => {
      if(!fullCheck) {
        const topicID = Constants.TOPIC_PAGE_REGEX.exec(topicUrl);
        if (topicID !== null || topicID.length !== 0) {
          resolve(parseInt(topicID[1]));
        }
        reject(null);
      } else {
        this._request(topicUrl, null, true).then((topicPage) => {
          if(topicPage) {
            const $ = cheerio.load(topicPage, { ignoreWhitespace: true });
            const urlAnswer = $('.a-menu-fofo').attr('href');
            const explodedUrlAnswer = urlAnswer.split('=');
            resolve(parseInt(explodedUrlAnswer[1]));
          }
          reject(null);
        });
      }
    });
  }

  _convertURLToPath(url) {
    if (Constants.TOPIC_PAGE_REGEX.test(url)) return url;
    const splitter = Constants.COMMON_REGEX_FORUM_TRANSFORMER.exec(url);
    if (splitter && splitter.length > 0) {
      return `forums/${splitter[1]}.htm`;
    }
    return splitter;
  }

  _createMaxPageURL(topicURL, postCount) {
    const explodedTopicURL = topicURL.split('-');
    explodedTopicURL[3] = Math.ceil(postCount / Constants.MAX_POSTS_PER_PAGE) + 1;
    return explodedTopicURL.join('-');
  }

  _checkSameForumReferer(topicUrl, forumUrl) {
    const explodedTopicURL = topicUrl.split('-');
    const explodedForumURL = forumUrl.split('-');
    return explodedForumURL[1] === explodedTopicURL[1];
  }
}

module.exports = JVC;
