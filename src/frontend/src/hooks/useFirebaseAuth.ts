import { useCallback, useEffect, useState } from "react";
import {
  type User,
  auth,
  firebaseSignOut,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "../lib/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
};

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
          photoURL: firebaseUser.photoURL ?? undefined,
        });
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
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
    signInWithGoogle,
    signOut,
    saveProfile,
  };
}
