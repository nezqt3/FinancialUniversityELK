const admin = require("firebase-admin");

let firestoreInstance = null;

const getFirebaseConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Firebase credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
};

const getFirestore = () => {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  const credentials = getFirebaseConfig();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
  firestoreInstance = admin.firestore();
  return firestoreInstance;
};

module.exports = {
  getFirestore,
};
