import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  ensureProfile,
  getCurrentSession,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from "../lib/auth";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadInitial() {
    setLoading(true);

    const sessionData = await getCurrentSession();
    setSession(sessionData);
    setUser(sessionData?.user || null);

    if (sessionData?.user) {
      const ensured = await ensureProfile(sessionData.user);
      setProfile(ensured);
    } else {
      setProfile(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInitial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);

      if (nextSession?.user) {
        const ensured = await ensureProfile(nextSession.user);
        setProfile(ensured);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    await signInWithEmail(email, password);
  }

  async function signup(email, password) {
    await signUpWithEmail(email, password);
  }

  async function logout() {
    await signOutUser();
  }

  return {
    session,
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    reloadAuth: loadInitial,
  };
}
