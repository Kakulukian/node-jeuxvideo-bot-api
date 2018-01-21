'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');
var request = require('request-promise');
var crypto = require('crypto');
var cheerio = require('cheerio');

var Constants = require('./Constants');

var JVC = function () {
  function JVC(options) {
    _classCallCheck(this, JVC);

    if (!options) options = {};
    this.options = {};
    this.options.username = options.username || '';
    this.options.password = options.password || '';
    this.options.loginFromCookie = options.loginFromCookie || {};
    this.cookieJar = request.jar();
    this.logged = false;
  }

  /**
  * Get forum list provided by jvc (it's generalist forums)
  * @return {Promise}
  */


  _createClass(JVC, [{
    key: 'getForumsList',
    value: function getForumsList() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this._request('/forums.htm').then(function (forumsPage) {
          if (forumsPage) {
            var $ = cheerio.load(forumsPage, { ignoreWhitespace: true });
            var forumsList = [];
            $('a').each(function (i, elt) {
              elt = $(elt);
              var forumUrl = elt.attr('href');
              if (Constants.FORUMS_LIST_REGEX.test(forumUrl)) {
                forumsList.push({
                  forumName: elt.text(),
                  forumUrl: forumUrl
                });
              }
            });
            resolve(forumsList);
          } else {
            reject('[ERROR] Unknown error.');
          }
        }).catch(function (err) {
          if (err) reject(err);
        });
      });
    }

    /**
    * Get topics list from a given forum
    * @param  {String} - URL or path of JVC forum
    * @return {Promise}
    */

  }, {
    key: 'getTopicsFromForum',
    value: function getTopicsFromForum(forumUrl) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        forumUrl = _this2._convertURLToPath(forumUrl);
        if (forumUrl === null) reject('[ERROR] It\'s not a jvc forum url.');

        _this2._parseTopicFromForumPage(forumUrl).then(function (topics) {
          resolve(topics);
        }).catch(function (err) {
          if (err) reject(err);
        });
      });
    }

    /**
    * Get posts from a given topic
    * @param  {String} - URL or path to a jvc forum
    * @param  {String} - Keyword to search
    * @param  {Integer} - Search mode : 0 => topic, 1 => author, 2 => message
    * @return {Promise}
    */

  }, {
    key: 'getTopicsFromForumSearch',
    value: function getTopicsFromForumSearch() {
      var forumUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var _this3 = this;

      var keyword = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var mode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      return new Promise(function (resolve, reject) {
        forumUrl = _this3._convertURLToPath(forumUrl);
        if (forumUrl === null) reject('[ERROR] It\'s not a jvc forum url.');
        if (mode > Constants.SEARCH_FORUM_MODE.length || mode < 0) reject('[ERROR] Mode choosed incorrect.');

        var forumSearchUrl = '' + Constants.SEARCH_FORUM_PREFIX + forumUrl + '?search_in_forum=' + keyword + '&type_search_in_forum=' + Constants.SEARCH_FORUM_MODE[mode];
        _this3._parseTopicFromForumPage(forumSearchUrl).then(function (topics) {
          resolve(topics);
        }).catch(function (err) {
          if (err) reject(err);
        });
      });
    }

    /**
    * Get posts from a given topic
    * @param  {String} - URL or path to a jvc topic
    * @return {Promise}
    */

  }, {
    key: 'getPostsFromTopic',
    value: function getPostsFromTopic(topicUrl) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        topicUrl = _this4._convertURLToPath(topicUrl);
        if (topicUrl === null) reject('[ERROR] It\'s not a jvc forum url.');

        _this4._request(topicUrl).then(function (postsPage) {
          if (postsPage) {
            var $ = cheerio.load(postsPage, { ignoreWhitespace: true });
            var topic = {
              posts: [],
              previous: '',
              next: ''
            };
            topic.next = _this4._decryptJVCare($(Constants.POSTS_LIST_SELECTOR.PAGE.NEXT).first());
            topic.previous = _this4._decryptJVCare($(Constants.POSTS_LIST_SELECTOR.PAGE.PREVIOUS).first());
            $(Constants.POSTS_LIST_SELECTOR.POST.ALL).each(function (i, elt) {
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
        }).catch(function (err) {
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

  }, {
    key: 'sendMessage',
    value: function sendMessage() {
      var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var _this5 = this;

      var topicUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var fullCheck = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return new Promise(function (resolve, reject) {
        topicUrl = _this5._convertURLToPath(topicUrl);
        if (topicUrl === null) reject('[ERROR] It\'s not a jvc forum url.');
        if (!_this5.logged) reject('[ERROR] You need to login in order to use sendMessage function.');
        if (!message || message.length === 0) reject('[ERROR] It need a message which is not empty.');

        _this5._convertTopicUrlToTopicID(topicUrl, fullCheck).then(function (topicId) {
          _this5._request('forums/create_message.php?id_topic=' + topicId, null, true).then(function (messagePage) {
            if (messagePage) {
              var $ = cheerio.load(messagePage, { ignoreWhitespace: true });
              if (!_this5._checkSameForumReferer(topicUrl, $('.lien-languette').first().attr('href'))) {
                return _this5.sendMessage(message, topicUrl, true);
              }
              var payload = {};
              var inputs = $('.form-post-msg').find('input');
              inputs.each(function () {
                payload[$(this).attr('name')] = $(this).attr('value');
              });
              payload.message_topic = message;
              _this5._request('forums/create_message.php?id_topic=' + topicId, payload, true).then(function (creationPage) {
                if (creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.AUTH) > -1 || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.CAPTCHA) > -1 || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.UNKNOWN_ERROR) > -1 || creationPage.indexOf(Constants.FAILED_CREATION_MESSAGE.LOCK) > -1) {
                  reject('[ERROR] Post in the topic failed. Reason : maybe you are not connected or delay between two posts is too small ...');
                }
                resolve();
              });
            } else {
              reject('[ERROR] Unknown error.');
            }
          }).catch(function (err) {
            if (err) reject(err);
          });
        });
      });
    }

    /**
    * Login account
    * @return {Promise}
    */

  }, {
    key: 'login',
    value: function login() {
      var _this6 = this;

      return new Promise(function (resolve, reject) {
        if (_this6.logged) resolve();
        var ctx = _this6;
        if (_this6.options.loginFromCookie.coniunctio) {
          var loginCookie = request.cookie('coniunctio=' + _this6.options.loginFromCookie.coniunctio);
          _this6.cookieJar.setCookie(loginCookie, Constants.BASE_API_JVC_FORUM_URL);
          // check if really connected
          _this6._request(Constants.CHECK_LOGIN_PATH, null, true).then(function (newTopicPage) {
            if (newTopicPage.indexOf(Constants.NOT_LOGGED_MESSAGE) > -1) {
              reject('[ERROR] Login by cookies failed, maybe you put the bad value of coniunctio cookie.');
            }
            ctx.logged = true;
            resolve();
          }).catch(function (err) {
            if (err) reject(err);
          });
        }
        if (_this6.options.username && _this6.options.password) {
          _this6._request('accounts/login', { alias: _this6.options.username, password: _this6.options.password }, false, true).then(function (a) {
            ctx.logged = true;
            resolve();
          }).catch(function (err) {
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

  }, {
    key: '_request',
    value: function _request(path, data) {
      var forumApi = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var pureApi = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var options = {
        jar: this.cookieJar,
        followRedirect: true,
        followAllRedirects: true,
        headers: {
          'Cache-Control': 'no-cache'
        },
        timeout: 1500
      };
      options.method = data ? 'POST' : 'GET';
      var baseUrl = forumApi ? Constants.BASE_API_JVC_FORUM_URL : pureApi ? Constants.BASE_API_JVC_URL : Constants.BASE_JVC_URL;
      options.url = baseUrl + path;

      if (forumApi || !forumApi && !pureApi) options.form = data;
      if (pureApi) {
        var timestamp = new Date(Date.now()).toISOString();
        var method = data ? 'POST' : 'GET';
        var signature = '550c04bf5cb2b\n' + timestamp + '\n' + method + '\napi.jeuxvideo.com\n/v4/' + path + '\n';
        var salt = 'd84e9e5f191ea4ffc39c22d11c77dd6c';
        signature = crypto.createHmac('sha256', salt).update(signature).digest('hex');
        var headers = 'PartnerKey=550c04bf5cb2b, Signature=' + signature + ', Timestamp=' + timestamp;
        options.headers = {
          'User-Agent': 'JeuxVideo-Android/202',
          'Content-Type': 'application/json',
          'Jvc-Authorization': headers
        };
        options.json = true;
        options.body = data;
      }
      return new Promise(function (resolve, reject) {
        request(options).then(function (resp) {
          resolve(resp);
        }).catch(function (error) {
          if (error.response) reject(error.response);
        });
      });
    }
  }, {
    key: '_parseTopicFromForumPage',
    value: function _parseTopicFromForumPage(forumUrl) {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        _this7._request(forumUrl).then(function (topicsPage) {
          if (topicsPage) {
            var topicList = {
              topics: [],
              next: '',
              previous: ''
            };
            if (topicsPage.indexOf(Constants.TOPICS_LIST_COMPARATOR.FAILED_SEARCH) > -1) resolve(topicList);

            var $ = cheerio.load(topicsPage, { ignoreWhitespace: true });
            topicList.next = _this7._decryptJVCare($(Constants.TOPICS_LIST_SELECTOR.PAGE.NEXT).first());
            topicList.previous = _this7._decryptJVCare($(Constants.TOPICS_LIST_SELECTOR.PAGE.PREVIOUS).first());
            $(Constants.TOPICS_LIST_SELECTOR.TOPIC.ALL).each(function (i, elt) {
              elt = $(elt);
              var subject = elt.find(Constants.TOPICS_LIST_SELECTOR.TOPIC.SUBJECT);
              var count = parseInt(elt.find(Constants.TOPICS_LIST_SELECTOR.TOPIC.COUNT).text());
              var firstPageUrl = subject.attr('href');
              var lastPageUrl = _this7._createMaxPageURL(firstPageUrl, count);
              topicList.topics.push({
                id: elt.attr('data-id'),
                subject: subject.attr('title'),
                count: count,
                author: elt.find(Constants.TOPICS_LIST_SELECTOR.TOPIC.AUTHOR).text().replace(Constants.WHITESPACE_REMOVER, ''),
                pinned: Constants.TOPICS_LIST_COMPARATOR.PINNED.test(elt.find(Constants.TOPICS_LIST_SELECTOR.TOPIC.PINNED).attr('src')),
                lastUpdate: elt.find(Constants.TOPICS_LIST_SELECTOR.TOPIC.LAST_UPDATE).text().replace(Constants.WHITESPACE_REMOVER, ''),
                firstPageUrl: firstPageUrl,
                lastPageUrl: lastPageUrl
              });
            });
            resolve(topicList);
          } else {
            reject('[ERROR] Unknown error.');
          }
        }).catch(function (err) {
          if (err) reject(err);
        });
      });
    }
  }, {
    key: '_convertTopicUrlToTopicID',
    value: function _convertTopicUrlToTopicID() {
      var _this8 = this;

      var topicUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var fullCheck = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return new Promise(function (resolve, reject) {
        if (!fullCheck) {
          var topicID = Constants.TOPIC_PAGE_REGEX.exec(topicUrl);
          if (topicID !== null || topicID.length !== 0) {
            resolve(parseInt(topicID[1]));
          }
          reject(null);
        } else {
          _this8._request(topicUrl, null, true).then(function (topicPage) {
            if (topicPage) {
              var $ = cheerio.load(topicPage, { ignoreWhitespace: true });
              var urlAnswer = $('.a-menu-fofo').attr('href');
              var explodedUrlAnswer = urlAnswer.split('=');
              resolve(parseInt(explodedUrlAnswer[1]));
            }
            reject(null);
          });
        }
      });
    }
  }, {
    key: '_convertURLToPath',
    value: function _convertURLToPath(url) {
      if (Constants.TOPIC_PAGE_REGEX.test(url)) return url;
      var splitter = Constants.COMMON_REGEX_FORUM_TRANSFORMER.exec(url);
      if (splitter && splitter.length > 0) {
        return 'forums/' + splitter[1] + '.htm';
      }
      return splitter;
    }
  }, {
    key: '_createMaxPageURL',
    value: function _createMaxPageURL(topicURL, postCount) {
      var explodedTopicURL = topicURL.split('-');
      explodedTopicURL[3] = Math.ceil(postCount / Constants.MAX_POSTS_PER_PAGE);
      return explodedTopicURL.join('-');
    }
  }, {
    key: '_checkSameForumReferer',
    value: function _checkSameForumReferer(topicUrl, forumUrl) {
      var explodedTopicURL = topicUrl.split('-');
      var explodedForumURL = forumUrl.split('-');
      return explodedForumURL[1] === explodedTopicURL[1];
    }
  }, {
    key: '_decryptJVCare',
    value: function _decryptJVCare(JVCareNode) {
      if (!JVCareNode || !JVCareNode.attr('class')) return '';
      var explodedClassNode = JVCareNode.attr('class').split(' ');
      var s = '';
      if (explodedClassNode.length > 1) {
        s = explodedClassNode[1];
      } else {
        return JVCareNode.attr('href');
      }
      var base16 = '0A12B34C56D78E9F';
      var link = '';
      for (var i = 0; i < s.length; i += 2) {
        link += String.fromCharCode(base16.indexOf(s.charAt(i)) * 16 + base16.indexOf(s.charAt(i + 1)));
      }
      return link;
    }
  }]);

  return JVC;
}();

module.exports = JVC;