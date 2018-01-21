'use strict';

module.exports = {
  COMMON_REGEX_FORUM_TRANSFORMER: RegExp('[https|http]*:\/\/[www\.|]*jeuxvideo\.com\/forums\/(.*)\.htm'),
  FORUMS_LIST_REGEX: RegExp('\/forums\/[0-9]{1}-([0-9]*)-[0-9]-[0-9]-[0-9]-[0-9]-[0-9]-.*\.htm'),
  TOPIC_PAGE_REGEX: RegExp('^\/forums\/[0-9]*-[0-9]*-([0-9]*)-[0-9]*-[0-9]*-[0-9]*-[0-9]*-.*\.htm'),
  RESEARCH_PAGE_REGEX: RegExp('^\/recherche\/forums\/[0-9]*-[0-9]*-[0-9]*-[0-9]*-[0-9]*-[0-9]*-[0-9]*-.*\.htm'),
  BASE_API_JVC_URL: 'https://api.jeuxvideo.com/v4/',
  BASE_API_JVC_FORUM_URL: 'https://api.jeuxvideo.com/',
  BASE_JVC_URL: 'https://jeuxvideo.com/',
  MAX_POSTS_PER_PAGE: 20,
  CHECK_LOGIN_PATH: '/forums/create_topic.php?id_forum=1',
  NOT_LOGGED_MESSAGE: 'Vous devez vous connecter pour créer un nouveau sujet',
  FAILED_CREATION_MESSAGE: {
    CAPTCHA: 'Le captcha est invalide',
    UNKNOWN_ERROR: 'Une erreur est survenue',
    AUTH: 'Vous devez vous connecter pour répondre au sujet',
    LOCK: 'lecture seule'
  },
  LOGIN_PATH: '',
  WHITESPACE_REMOVER: / /g,
  TOPICS_LIST_SELECTOR: {
    PAGE: {
      NEXT: '.pagi-suivant-actif',
      PREVIOUS: '.pagi-precedent-actif'
    },
    TOPIC: {
      ALL: 'li[data-id][class=""]',
      PINNED: 'img.topic-img',
      SUBJECT: '.lien-jv.topic-title',
      COUNT: '.topic-count',
      AUTHOR: '.topic-author',
      LAST_UPDATE: '.topic-date'
    }
  },
  TOPICS_LIST_COMPARATOR: {
    PINNED: RegExp('marque'),
    FAILED_SEARCH: 'Aucune réponse pour votre recherche'
  },
  POSTS_LIST_SELECTOR: {
    PAGE: {
      NEXT: '.pagi-suivant-actif',
      PREVIOUS: '.pagi-precedent-actif'
    },
    POST: {
      ALL: '.bloc-message-forum',
      CONTENT: '.txt-msg.text-enrichi-forum',
      AUTHOR: '.user-avatar-msg',
      CREATED_DATE: '.bloc-date-msg'
    }
  },
  SEARCH_FORUM_PREFIX: 'recherche/',
  SEARCH_FORUM_MODE: ['titre_topic', 'auteur_topic', 'texte_message'],
  STATUS_CODE_ERROR_MESSAGE: {
    429: '[ERROR] Too many requests, try to delay execution.',
    404: '[ERROR] It seems you manage to request inexistant page.',
    410: '[ERROR] You asked a page which does\'t exist anymore.'
  }
};