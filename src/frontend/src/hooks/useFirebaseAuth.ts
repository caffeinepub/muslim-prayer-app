import { useCallback, useEffect, useState } from "react";
import {
  EMAIL_KEY,
  type User,
  actionCodeSettings,
  auth,
  firebaseSignOut,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "../lib/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
};

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Handle email link sign-in on page load
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem(EMAIL_KEY);
      if (!email) {
        // Prompt user for email if not stored (e.g. different device)
        email = window.prompt("Введите ваш email для подтверждения входа:");
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem(EMAIL_KEY);
            // Clean up URL after sign-in
            window.history.replaceState(null, "", window.location.pathname);
          })
          .catch((err) => {
            console.error("Email link sign-in error:", err);
          });
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setProfile({
          uid: firebaseUser.uid,
          name:
            firebaseUser.displayName ||
            (firebaseUser.email ? firebaseUser.email.split("@")[0] : ""),
          email: firebaseUser.email ?? "",
        });
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(EMAIL_KEY, email);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const saveProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      setProfile((prev) =>
        prev
          ? { ...prev, ...data }
          : { uid: user.uid, name: data.name ?? "", email: data.email ?? "" },
      );
    },
    [user],
  );

  return {
    user,
    isLoading,
    profile,
    signInWithEmail,
    signOut,
    saveProfile,
  };
}
