import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await logAuthEvent(result.user.uid, 'sign-in', result.user.email || 'google-user');
  }
  return result;
};

export const signInAdmin = async (username: string, password: string) => {
  // Map username to a pseudo-email for Firebase Auth
  const email = `${username}@healix.admin`;
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await logAuthEvent(result.user.uid, 'sign-in', email);
    }
    return result;
  } catch (error: any) {
    // If user doesn't exist, try to create it for the first time (only for this specific admin)
    if (error.code === 'auth/user-not-found' && username === 'healix' && password === 'health26') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await logAuthEvent(result.user.uid, 'sign-in', email);
      }
      return result;
    }
    throw error;
  }
};

export const logout = async () => {
  if (auth.currentUser) {
    await logAuthEvent(auth.currentUser.uid, 'sign-out', auth.currentUser.email || 'unknown');
  }
  return signOut(auth);
};

async function logAuthEvent(uid: string, type: 'sign-in' | 'sign-out', email: string) {
  try {
    await addDoc(collection(db, 'authLogs'), {
      uid,
      email,
      type,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging auth event:", error);
  }
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
