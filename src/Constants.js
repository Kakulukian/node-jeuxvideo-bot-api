module.exports = {
  COMMON_REGEX_FORUM_TRANSFORMER: RegExp('[https|http]*:\/\/[www\.|]*jeuxvideo\.com\/forums\/(.*)\.htm'),
  FORUMS_LIST_REGEX: RegExp('\/forums\/[0-9]{1}-([0-9]*)-[0-9]-[0-9]-[0-9]-[0-9]-[0-9]-.*\.htm'),
  TOPIC_PAGE_REGEX: RegExp('^\/forums\/[0-9]*-[0-9]*-([0-9]*)-[0-9]*-[0-9]*-[0-9]*-[0-9]*-.*\.htm'),
  BASE_API_JVC_URL: 'https://api.jeuxvideo.com/v4/',
  BASE_API_JVC_FORUM_URL: 'https://api.jeuxvideo.com/',
  BASE_JVC_URL: 'https://jeuxvideo.com/',
  MAX_POSTS_PER_PAGE: 20,
  CHECK_LOGIN_PATH: '/forums/create_topic.php?id_forum=1',
  NOT_LOGGED_MESSAGE: 'Vous devez vous connecter pour créer un nouveau sujet',
  FAILED_CREATION_MESSAGE: {
    CAPTCHA: 'Le captcha est incorrect',
    UNKNOWN_ERROR: 'Une erreur est survenue',
    AUTH: 'Vous devez vous connecter pour répondre au sujet'
  },
  LOGIN_PATH: '',
  WHITESPACE_REMOVER: / /g,
  TOPICS_LIST_SELECTOR: {
    ALL: 'li[data-id][class=""]',
    PINNED: 'img.topic-img',
    SUBJECT: '.lien-jv.topic-title',
    COUNT: '.topic-count',
    AUTHOR: '.topic-author',
    LAST_UPDATE: '.topic-date'
  },
  TOPICS_LIST_COMPARATOR: {
    PINNED: RegExp('marque')  
  },
  POSTS_LIST_SELECTOR: {
    PAGE: {
      LINK: '.lien-jv',
      CURRENT: '.page-active'
    },
    POST: {
      ALL: '.bloc-message-forum',
      CONTENT: '.txt-msg.text-enrichi-forum',
      AUTHOR: '.user-avatar-msg',
      CREATED_DATE: '.bloc-date-msg'
    }
  }
};
