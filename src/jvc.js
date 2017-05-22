/* eslint-disable no-useless-escape */
const EventEmitter = require('eventemitter3');
const Promise = require('bluebird');
const request = require('request-promise');
const crypto = require('crypto');
const moment = require('moment');
const cheerio = require('cheerio');
const debug = require('debug')('node-jeuxvideo-bot-api');

class JvcBot extends EventEmitter {

  /**
   * @JvcBot
   * @param  {Boolean} [options.watchOnly] If you don't need login
   * @param {String} [options.username] Login on Jeuxvideo.com
   * @param {String} [options.password] Password on Jeuxvideo.com
   * @param {String} [options.topicURLWatcher] Topic watched by bot
   * @param {Integer} [options.delayBetweenScrap] Delay between to scrape to fetch the last message
   * @param {String} [options.baseApiUrl] Base Api Url
   * @param {String} [options.baseUrl] Base Url
   * @param {Object} [options.loginFromCookie] JVC Cookies
   */
  constructor(options) {
    super();
    this.options = {};
    this.options.watchOnly = (options.watchOnly) ? options.watchOnly : false;
    this.options.username = options.username || '';
    this.options.password = options.password || '';
    this.options.topicURLWatcher = options.topicURLWatcher || '';
    this.options.topicURLWatcher = this.options.topicURLWatcher.split('/').filter(function (elt, i) {
      if (i > 2) {
        return elt;
      }
      return '';
    }).join('/');
    this.options.delayBetweenScrap = options.delayBetweenScrap || 10000;
    this.options.baseApiUrl = options.baseApiUrl || 'https://api.jeuxvideo.com/v4/';
    this.options.baseUrl = options.baseUrl || 'https://jeuxvideo.com/';
    this.options.loginFromCookie = options.loginFromCookie || {};
    this.cookieJar = request.jar();
    this.existingPosts = [];
    this.maxPage = 1;
    this.runningScrape = false;
    this.initScrapeFinished = false;
    this.messageQueue = [];
    this.startPolling();
    const ctx = this;
    this.intervalPolling = setInterval(() => { ctx.startPolling(); }, this.options.delayBetweenScrap);
    if (!this.options.watchOnly) {
      this.login();
    }
  }

  /**
   * Return max page of topic
   * @param  {Cheerio} $
   * @param  {Node} linkPagination
   * @return {Integer}
   */
  getPageMax($, linkPagination) {
    let max = 0;
    for (let i = 0; i < linkPagination.length; i++) {
      const currentNode = parseInt($(linkPagination[i]).text(), 10);
      if (!isNaN(currentNode)) {
        if (currentNode > max) {
          max = currentNode;
        }
      }
    }
    return max;
  }

  /**
   * Save all postID in arrays
   * @param  {String} path Topic url
   * @param  {Integer} i    Page
   * @return {String} Response
   */
  retrieveBulkPosts(path, i) {
    const ctx = this;
    const paths = path.split('-');
    paths[3] = i;
    const newPath = paths.join('-');
    return this.request(newPath).then((resp) => {
      if (resp) {
        const $ = cheerio.load(resp, { ignoreWhitespace: true });
        $('.bloc-message-forum').each(function () {
          ctx.existingPosts.push($(this).attr('data-id'));
        });
        const maxPage = ctx.getPageMax($, $('div.bloc-liste-num-page').find('span a'));
        const currentPage = parseInt($($('.page-active')[0]).text(), 10);
        ctx.maxPage = currentPage > maxPage ? currentPage : maxPage;
        if (i === ctx.maxPage) {
          ctx.initScrapeFinished = true;
          ctx.emit('ready');
        }
        return Promise.resolve();
      }
      debug('[WARN] Crawl fails : %s', newPath);
      return Promise.reject();
    });
  }

  /**
   * Make difference between saved posts and new post and emit new post
   * @param  {String} path Topic url
   * @param  {Integer} i    Page
   * @return {String} Response
   */
  retrievePost(path, i) {
    const ctx = this;
    const paths = path.split('-');
    paths[3] = i;
    const newPath = paths.join('-');
    return this.request(newPath).then((resp) => {
      if (resp) {
        const $ = cheerio.load(resp, { ignoreWhitespace: true });
        $('.bloc-message-forum').each(function () {
          const author = $(this).find('.user-avatar-msg').attr('alt');
          if (ctx.existingPosts.indexOf($(this).attr('data-id')) === -1 && author !== ctx.options.username) {
            const post = {
              id: $(this).attr('data-id'),
              message: $(this).find('.txt-msg.text-enrichi-forum').text(),
              author
            };
            ctx.emit('message', post);
            ctx.existingPosts.push(post.id);
          }
        });
        const maxPage = ctx.getPageMax($, $('div.bloc-liste-num-page').find('span a'));
        const currentPage = parseInt($($('.page-active')[0]).text(), 10);
        ctx.maxPage = currentPage > maxPage ? currentPage : maxPage;
        return Promise.resolve();
      }
      debug('[WARN] Crawl fails : %s', newPath);
      return Promise.reject();
    }).catch((err) => {
      Promise.reject(err);
    });
  }

  /**
   * startPolling permits to run the bot
   */
  startPolling() {
    if (!this.initScrapeFinished && !this.runningScrape) {
      const ctx = this;
      this.runningScrape = true;
      this.request(this.options.topicURLWatcher).then((resp) => {
        if (resp) {
          const $ = cheerio.load(resp, { ignoreWhitespace: true });
          const maxPage = ctx.getPageMax($, $('div.bloc-liste-num-page').find('span a'));
          const currentPage = parseInt($($('.page-active')[0]).text(), 10);
          ctx.maxPage = currentPage > maxPage ? currentPage : maxPage;
          if (ctx.maxPage !== 1) {
            debug('[INFO] There are %d pages.', ctx.maxPage);
            return ctx.retrieveBulkPosts(this.options.topicURLWatcher, ctx.maxPage).then();
          }
          $('.bloc-message-forum').each(function () {
            ctx.existingPosts.push($(this).attr('data-id'));
          });
          ctx.initScrapeFinished = true;
          ctx.emit('ready');
          return Promise.resolve();
        }
        debug('[WARN] First crawl fails : %s', ctx.options.topicURLWatcher);
        this.runningScrape = false;
        return Promise.reject();
      });
    }
    if (this.initScrapeFinished) {
      this.retrievePost(this.options.topicURLWatcher, this.maxPage).then();
    }
    if (this.messageQueue.length > 0) {
      debug('[INFO] Message queue processed by routine.');
      const message = this.messageQueue.pop();
      return this.sendMessage(message.message, message.topicId);
    }
  }

  /**
   * Http call Jeuxvideo.com
   * @param  {String} path
   * @param  {Object} data to post
   * @return {String} Response
   */
  request(path, data = false, forumApi = false) {
    const method = data ? 'POST' : 'GET';
    const baseUrl = forumApi ? 'https://api.jeuxvideo.com/' : this.options.baseUrl;
    const url = baseUrl + path;
    const options = {
      method,
      url,
      jar: this.cookieJar,
      followRedirect: true,
      followAllRedirects: true,
      headers: {
        'Cache-Control': 'no-cache'
      },
      timeout: 1500,
    };
    options.form = data;
    return request(options).then((resp) => {
      return resp;
    }).catch((error) => {
      if (error.response) throw error;
    });
  }

  /**
   * Call Jeuxvideo.com API
   * @param  {String} path
   * @param  {Object} data to post
   * @return {String} Response
   */
  requestAPI(path, data) {
    const timestamp = moment(Date.now()).format('YYYY-MM-DD\THH:mm:ss+00:00');
    const method = data ? 'POST' : 'GET';
    let signature = `550c04bf5cb2b\n${timestamp}\n${method}\napi.jeuxvideo.com\n/v4/${path}\n`;
    const salt = 'd84e9e5f191ea4ffc39c22d11c77dd6c';
    signature = crypto.createHmac('sha256', salt).update(signature).digest('hex');
    const headers = `PartnerKey=550c04bf5cb2b, Signature=${signature}, Timestamp=${timestamp}`;
    const options = {
      method,
      url: this.options.baseApiUrl + path,
      headers: {
        'User-Agent': 'JeuxVideo-Android/202',
        'Content-Type': 'application/json',
        'Jvc-Authorization': headers
      },
      jar: this.cookieJar
    };

    if (data) {
      options.method = method;
      options.body = data;
      options.json = true;
    }
    const ctx = this;
    return request(options).then((resp) => {
      return resp;
    }).catch((error) => {
      clearInterval(ctx.intervalPolling);
      if (error.response) Promise.reject(error.response.body.message);
    });
  }

  /**
   * Login JVC Account
   * @return {Promise}
   */
  login() {
    if (this.options.loginFromCookie.coniunctio) {
      const loginCookie = request.cookie(`coniunctio=${this.options.loginFromCookie.coniunctio}`);
      this.cookieJar.setCookie(loginCookie, this.options.baseApiUrl.replace('v4/', ''));
      debug('[INFO] Login by cookie done.');
      return Promise.resolve();
    }
    if (this.options.username && this.options.password) {
      return this.requestAPI('accounts/login', { alias: this.options.username, password: this.options.password }).then(() => {
        debug('[INFO] Login by API done.');
        return Promise.resolve();
      });
    }
    debug('[ERROR] Login failed');
    return Promise.reject('The bot needs your password and login.');
  }

  /**
   * Send message on the watched topic, if fails put message in a queue
   * @param  {String} message
   * @return {Promise}
   */
  sendMessage(message) {
    if (this.options.watchOnly) return Promise.reject('Watch mode scope activated. Please remove it.');
    if (!message) return Promise.reject('Need a message.');
    const topicId = this.options.topicURLWatcher.split('-')[2];
    const ctx = this;
    return this.request(`forums/create_message.php?id_topic=${topicId}`, false, true).then((resp) => {
      if (resp) {
        const $ = cheerio.load(resp);
        const inputs = $('.form-post-msg').find('input');
        const payload = {};
        inputs.each(function () {
          payload[$(this).attr('name')] = $(this).attr('value');
        });
        payload.message_topic = message;
        return this.request(`forums/create_message.php?id_topic=${topicId}`, payload, true).then((r) => {
          if (r) {
            if (r.toLowerCase().indexOf('erreur') > -1 || r.indexOf('Une erreur est survenue') > -1 ||
                r.indexOf('Vous devez vous connecter pour répondre au sujet') > -1) {
              ctx.messageQueue.push({ message, topicId });
              return Promise.reject('[ERROR] Post in the topic. Reason : maybe you are not connected or delay between two post is too small ...');
            }
            debug('[INFO] Message posted');
            return Promise.resolve();
          }
          ctx.messageQueue.push({ message, topicId });
          debug('[WARN] Seems crawl fails, message put in queue.');
          return Promise.reject();
        });
      } else {
        ctx.messageQueue.push({ message, topicId });
        debug('[WARN] Seems crawl fails, message put in queue.');
        return Promise.reject();
      }
    });
  }

  /**
   * Retrieve message queue length
   * @return {Integer} Queue length
   */
  getQueueLength() {
    return this.messageQueue.length;
  }

  /**
   * Retrieve cookie jar to save it
   * @return CookieJar
   */
  getCookieJar() {
    return this.cookieJar;
  }
}

module.exports = JvcBot;
