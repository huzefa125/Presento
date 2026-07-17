const admin = require('firebase-admin');
const Logger = require('../utils/logger');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Sanitize private key: handle escaped newlines and surrounding quotes
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawKey
      ? rawKey
          .trim()
          .replace(/\\n/g, '\n')
          .replace(/^"|"$/g, '')
          .replace(/^'|'$/g, '')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });

    firebaseInitialized = true;
    Logger.startup('Firebase Admin initialized');
  } catch (error) {
    Logger.error('Firebase initialization failed', error);
    throw error;
  }
};

module.exports = initializeFirebase;
