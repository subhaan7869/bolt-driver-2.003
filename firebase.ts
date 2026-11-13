import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate initial connection to Firestore on app boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function initializeFCMToken(uid: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  try {
    let fcmRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      // Keep Firebase Messaging separate from the Workbox PWA worker at '/'.
      fcmRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/firebase-cloud-messaging-push-scope/' }
      );
    }
    if (Notification.permission === 'granted') {
      const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      if (!supported || !fcmRegistration) return null;
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        serviceWorkerRegistration: fcmRegistration,
      }).catch(() => null);
      if (token) {
        await updateDoc(doc(db, 'users', uid), { fcmToken: token }).catch(() => {});
        return token;
      }
    }
  } catch {
    // Ignore FCM token errors when VAPID key is not configured
  }
  return null;
}
