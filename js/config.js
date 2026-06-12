/* ============================================================
   VIDYA STEM – App Configuration
   js/config.js  |  v3.0.0
   ============================================================ */

const APP_CONFIG = {
  name: 'VIDYA STEM',
  subtitle: 'Inventory Audit System',
  version: '3.0.0',

  /* ── Telegram Bot (replace with your values) ── */
  telegram: {
    botToken: '8341958686:AAHnTrqssusIY255LxEXuAYWBg0ciXcI0o8',
    chatId: '8491693466',
    enabled: true   // set false to disable Telegram push
  },

  /* ── Firebase Config (replace with your values) ── */
  firebaseConfig: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  /* ── Local Storage keys ── */
  storage: {
    session: 'vidya_session',
    audits: 'vidya_audits',
    draft: 'vidya_draft'
  },

  /* ── Item master files ── */
  itemFiles: {
    lab1: './data/lab1items.json',
    lab2: './data/lab2items.json',
    lab3: './data/lab3items.json'
  },

  /* ── Swipe thresholds ── */
  swipe: {
    threshold: 185,
    flyDistance: 250
  },

  /* ── Session (minutes) ── */
  sessionTimeout: 60,

  /* ── Status colors ── */
  statusColors: {
    'Well Present': '#2a9d8f',
    'Broken': '#f4a261',
    'Missing': '#e63946'
  },

  statusIcons: {
    'Well Present': 'fa-circle-check',
    'Broken': 'fa-circle-exclamation',
    'Missing': 'fa-circle-xmark'
  }
};
