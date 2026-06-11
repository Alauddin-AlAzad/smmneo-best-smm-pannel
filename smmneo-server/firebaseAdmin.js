const admin = require('firebase-admin');

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || null;
const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.GOOGLE_PROJECT_ID || null;
const hasServiceAccountVars = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;

let initialized = false;
let firebaseApp = null;
let firestore = null;
let initError = null;

function normalizePrivateKey(value) {
  if (!value || typeof value !== 'string') return value;
  // Handle both escaped \\n and actual newlines
  return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
}

function normalizeProjectId(options) {
  if (!options || typeof options !== 'object') return options;
  if (!options.projectId && envProjectId) {
    options.projectId = envProjectId;
  }
  if (!options.project_id && envProjectId) {
    options.project_id = envProjectId;
  }
  return options;
}

function getCredentialOptions() {
  if (serviceAccountJson) {
    let parsed;
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch (err) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${err.message}`);
    }
    if (parsed.private_key) {
      parsed.private_key = normalizePrivateKey(parsed.private_key);
    }
    return normalizeProjectId(parsed);
  }

  if (hasServiceAccountVars) {
    return normalizeProjectId({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    });
  }

  return null;
}

function initFirebase() {
  if (initialized || initError) {
    return { app: firebaseApp, firestore, error: initError };
  }

  const credentialOptions = getCredentialOptions();
  const appOptions = {};

  try {
    console.log('🔥 Initializing Firebase...');
    console.log('Has FIREBASE_SERVICE_ACCOUNT:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('Has FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('Has FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Has FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    if (credentialOptions) {
      appOptions.credential = admin.credential.cert(credentialOptions);
      if (credentialOptions.projectId || credentialOptions.project_id) {
        appOptions.projectId = credentialOptions.projectId || credentialOptions.project_id;
      }
      console.log('✅ Using service account credentials');
    } else {
      if (!envProjectId) {
        throw new Error('Firebase project ID is required in serverless environments. Set FIREBASE_PROJECT_ID or provide FIREBASE_SERVICE_ACCOUNT JSON.');
      }
      process.env.GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || envProjectId;
      process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || envProjectId;
      appOptions.credential = admin.credential.applicationDefault();
      appOptions.projectId = envProjectId;
      console.log('✅ Using application default credentials');
    }

    firebaseApp = admin.initializeApp(appOptions);
    firestore = admin.firestore();
    initialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (err) {
    console.error('❌ Firebase initialization error:', err.message);
    initError = err;
  }

  return { app: firebaseApp, firestore, error: initError };
}

function getFirebaseAdmin() {
  if (!initialized && !initError) {
    return initFirebase();
  }
  return { app: firebaseApp, firestore, error: initError };
}

function verifyIdToken(token) {
  const { app, error } = getFirebaseAdmin();
  if (error) {
    return Promise.reject(error);
  }
  return admin.auth(app).verifyIdToken(token);
}

module.exports = {
  initFirebase,
  getFirebaseAdmin,
  verifyIdToken,
};
