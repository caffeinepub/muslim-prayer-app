import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { type UserProfile, supabase } from "../lib/supabase";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void loadProfile(s.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string) => {
    setEmailError(null);
    setIsEmailSent(false);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) {
      setEmailError(error.message);
    } else {
      setIsEmailSent(true);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsEmailSent(false);
    setEmailError(null);
  }, []);

  const saveProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const payload: UserProfile = {
        user_id: user.id,
        name: data.name ?? profile?.name ?? "",
        email: data.email ?? user.email ?? "",
        prayer_method: data.prayer_method ?? profile?.prayer_method ?? "",
        madhab: data.madhab ?? profile?.madhab ?? "",
        location_name: data.location_name ?? profile?.location_name ?? "",
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (!error) {
        setProfile({ ...payload });
      }
    },
    [user, profile],
  );

  return {
    user,
    session,
    isLoading,
    profile,
    isEmailSent,
    emailError,
    signInWithEmail,
    signOut,
    saveProfile,
  };
}
