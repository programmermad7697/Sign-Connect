import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

function getCredential() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (encoded) {
    try {
      return cert(
        JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))
      );
    } catch (error) {
      console.error("Invalid Firebase service account:", error);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_BASE64");
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin environment variables are missing."
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

/**
 * Firebase Admin is initialized lazily.
 *
 * This is important for Vercel/Next.js because we don't want
 * Firebase Admin credentials to be evaluated during the build.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: getCredential(),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}