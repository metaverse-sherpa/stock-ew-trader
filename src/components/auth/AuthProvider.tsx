import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: any; user: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If successful, create user settings if they don't exist
    if (!error) {
      try {
        const { data: existingSettings } = await supabase
          .from("user_settings")
          .select("id")
          .single();

        if (!existingSettings) {
          await supabase.from("user_settings").insert({
            default_timeframe: "1d",
            email: email,
            email_subscribed: true,
            wave_alerts_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (settingsError) {
        console.error("Error creating user settings:", settingsError);
      }
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Use regular signup since admin functions may not be available
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    // Create user settings on signup
    if (!error && data.user) {
      try {
        await supabase.from("user_settings").insert({
          default_timeframe: "1d",
          email: email,
          email_subscribed: true,
          wave_alerts_enabled: true,
          user_id: data.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (settingsError) {
        console.error("Error creating user settings:", settingsError);
      }
    }

    return { error, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
