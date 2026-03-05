import { initializeApp } from "firebase/app";
import {
  type User,
  signOut as firebaseSignOut,
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAz4_xsaEQ931uDsE010xBIXO97EFI5thM",
  authDomain: "friday-51d52.firebaseapp.com",
  projectId: "friday-51d52",
  storageBucket: "friday-51d52.firebasestorage.app",
  messagingSenderId: "256619826172",
  appId: "1:256619826172:web:c63b1976e1dd6774934079",
  measurementId: "G-33QSVS04TB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const CONTINUE_URL = "https://draft.caffeine.xyz";
export const EMAIL_KEY = "firebaseEmailForSignIn";

export const actionCodeSettings = {
  url: CONTINUE_URL,
  handleCodeInApp: true,
};

export {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  onAuthStateChanged,
  firebaseSignOut,
};

export type { User };
