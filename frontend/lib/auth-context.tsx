'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isMockMode, mockDb, generateUUID } from './supabase';
import { Profile, UserRole } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// ─── Mock Users Storage (for non-Supabase / demo mode) ───────────────────────

const MOCK_USERS_KEY = 'fleetfoam_mock_users';
const MOCK_SESSION_KEY = 'fleetfoam_mock_session';

interface MockUser {
  id: string;
  email: string;
  password: string; // plaintext for demo only
  name: string;
  role: UserRole;
}

function getMockUsers(): MockUser[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

// ─── Role Cookie (for middleware route protection) ────────────────────────────
function setRoleCookie(role: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `fleetfoam_role=${role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
}

function clearRoleCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'fleetfoam_role=; path=/; SameSite=Lax; max-age=0';
}

function getMockSession(): MockUser | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveMockSession(user: MockUser | null) {
  if (user) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
  }
}

// ─── Default Demo Passwords / Accounts ───────────────────────────────────────
export const DEMO_PASSWORDS = ['password123', 'FleetFoam2026!', 'admin123'];

const DEMO_ACCOUNTS: Record<string, { name: string; role: UserRole }> = {
  // 👑 The 4 Team Members (Admin / Operations Access)
  'earlstephensenoran@gmail.com': { name: 'Earlstephen Señoran (Frontend)', role: 'OPERATIONS' },
  'earl@fleetfoam.com':           { name: 'Earlstephen Señoran (Frontend)', role: 'OPERATIONS' },
  'marriane@fleetfoam.com':       { name: 'Marriane Angel Samson (Project Manager)', role: 'OPERATIONS' },
  'michael@fleetfoam.com':        { name: 'Michael Sapinoso (Backend/Database)', role: 'OPERATIONS' },
  'jeric@fleetfoam.com':          { name: 'Jeric Ramos (QA/DevOps Lead)', role: 'OPERATIONS' },

  // Role Operations Testing Accounts
  'ops@fleetfoam.com':            { name: 'Sarah Jenkins (Ops Admin)', role: 'OPERATIONS' },
  'admin@fleetfoam.com':          { name: 'System Administrator', role: 'OPERATIONS' },
  'dispatch@fleetfoam.com':       { name: 'Operations Dispatcher', role: 'OPERATIONS' },

  // Detailing Crew & Customer Evaluation Accounts
  'crew@fleetfoam.com':           { name: 'Marcus Vance (Lead Detailing Tech)', role: 'CREW' },
  'customer@fleetfoam.com':       { name: 'Brooke Sterling (VIP Fleet Customer)', role: 'CUSTOMER' },
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to persist session to state, localStorage & cookie
  const applySession = useCallback((authUser: AuthUser, authProfile: Profile) => {
    setUser(authUser);
    setProfile(authProfile);
    saveMockSession({
      id: authUser.id,
      email: authUser.email,
      password: '',
      name: authProfile.name,
      role: authProfile.role,
    });
    setRoleCookie(authProfile.role); // For middleware route protection
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setProfile(null);
    saveMockSession(null);
    clearRoleCookie(); // Remove role cookie on sign out
  }, []);

  // ─── Fetch Profile Helper ──────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }, []);

  // ─── Unified SignUp ────────────────────────────────────────────────────────
  const handleSignUp = useCallback(
    async (email: string, password: string, name: string, role: UserRole): Promise<{ error: string | null }> => {
      const normalizedEmail = email.trim().toLowerCase();
      const users = getMockUsers();

      if (users.find((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { error: 'An account with this email already exists.' };
      }

      // Generate a valid RFC4122 v4 UUID (PostgreSQL strict UUID compatible)
      const generatedId = generateUUID();

      // Save locally first so user can ALWAYS log in even if Supabase network drops
      const localUser: MockUser = {
        id: generatedId,
        email: normalizedEmail,
        password,
        name: name.trim(),
        role,
      };
      users.push(localUser);
      saveMockUsers(users);

      let finalId = generatedId;

      // Ensure registration in Supabase
      if (!isMockMode) {
        // 1. Try Supabase Auth (stores auth credentials if rate limit not reached)
        try {
          const { data, error: sbError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { data: { name: name.trim(), role } },
          });

          if (!sbError && data?.user?.id) {
            finalId = data.user.id;
            localUser.id = finalId;
            saveMockUsers(users);
          } else if (sbError) {
            console.warn('Supabase Auth note (proceeding with direct DB profile sync):', sbError.message);
          }
        } catch (err) {
          console.warn('Supabase remote signup warning:', err);
        }

        // 2. GUARANTEED: Direct upsert to Supabase profiles database table
        try {
          const { data: dbProfile, error: profileErr } = await supabase
            .from('profiles')
            .upsert(
              {
                id: finalId,
                email: normalizedEmail,
                name: name.trim(),
                role,
              },
              { onConflict: 'email' }
            )
            .select()
            .single();

          if (profileErr) {
            console.error('Direct Supabase profiles upsert error:', profileErr);
          } else if (dbProfile) {
            finalId = dbProfile.id;
            localUser.id = finalId;
            saveMockUsers(users);
          }
        } catch (dbErr) {
          console.error('Supabase profiles table insert error:', dbErr);
        }
      }

      const p: Profile = {
        id: finalId,
        email: normalizedEmail,
        name: name.trim(),
        role,
        phone: '+63 917 555 0100',
        status: 'ACTIVE',
      };
      mockDb.addProfile(p);
      applySession({ id: finalId, email: normalizedEmail, profile: p }, p);
      return { error: null };
    },
    [applySession]
  );

  // ─── Unified SignIn ────────────────────────────────────────────────────────
  const handleSignIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check Demo / Team Accounts (Enforce strict password check)
      if (DEMO_ACCOUNTS[normalizedEmail]) {
        if (!DEMO_PASSWORDS.includes(password)) {
          return {
            error: 'Invalid email or password. Please check your credentials.',
          };
        }

        const demo = DEMO_ACCOUNTS[normalizedEmail];
        const p: Profile = {
          id: 'demo-' + normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: normalizedEmail,
          name: demo.name,
          role: demo.role,
        };
        applySession({ id: p.id, email: normalizedEmail, profile: p }, p);
        return { error: null };
      }

      // 2. Try Supabase Auth if not in pure mock mode
      let supabaseUser: { id: string; email: string; user_metadata?: Record<string, any> } | null = null;

      if (!isMockMode) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (!error && data.user) {
            supabaseUser = {
              id: data.user.id,
              email: data.user.email!,
              user_metadata: data.user.user_metadata,
            };
          } else if (error) {
            const errLower = error.message?.toLowerCase() || '';
            if (errLower.includes('invalid login credentials')) {
              return {
                error: 'Invalid email or password. Please check your credentials.',
              };
            }
            if (errLower.includes('email not confirmed')) {
              return {
                error: 'Your email address is not yet confirmed. Please verify your email or use a demo account.',
              };
            }
          }
        } catch {
          // If network error, proceed to local mock users check
        }
      }

      // If Supabase authenticated successfully:
      if (supabaseUser) {
        let p = await fetchProfile(supabaseUser.id);
        if (!p) {
          const metaName = supabaseUser.user_metadata?.name || normalizedEmail.split('@')[0];
          const metaRole = (supabaseUser.user_metadata?.role as UserRole) || 'CUSTOMER';
          try {
            await supabase.from('profiles').upsert({
              id: supabaseUser.id,
              email: normalizedEmail,
              name: metaName,
              role: metaRole,
            });
          } catch {}
          p = { id: supabaseUser.id, email: normalizedEmail, name: metaName, role: metaRole };
        }
        applySession({ id: supabaseUser.id, email: normalizedEmail, profile: p }, p);
        return { error: null };
      }

      // 3. Fallback: Check local registered users (from this device/browser signup)
      const localUsers = getMockUsers();
      const matchedLocal = localUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (matchedLocal) {
        if (matchedLocal.password === password) {
          const p: Profile = {
            id: matchedLocal.id,
            email: matchedLocal.email,
            name: matchedLocal.name,
            role: matchedLocal.role,
          };
          applySession({ id: matchedLocal.id, email: matchedLocal.email, profile: p }, p);
          return { error: null };
        } else {
          return {
            error: 'Invalid email or password. Please check your credentials.',
          };
        }
      }

      // 4. No account matched or invalid credentials
      return {
        error: 'Invalid email or password. Please check your credentials or create a new account.',
      };
    },
    [applySession, fetchProfile]
  );

  // ─── Unified SignOut ───────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    if (!isMockMode) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    clearSession();
  }, [clearSession]);

  // ─── Init & Session Restoration ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      // First check local stored session for instant rendering
      const stored = getMockSession();
      if (stored && isMounted) {
        const p: Profile = { id: stored.id, email: stored.email, name: stored.name, role: stored.role };
        setUser({ id: stored.id, email: stored.email, profile: p });
        setProfile(p);
      }

      if (!isMockMode) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user && isMounted) {
            const u = data.session.user;
            const p = await fetchProfile(u.id);
            if (p) {
              applySession({ id: u.id, email: u.email!, profile: p }, p);
            }
          }
        } catch {}
      }

      if (isMounted) setLoading(false);
    }

    initSession();

    let unsubscribe = () => {};
    if (!isMockMode) {
      try {
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            const u = session.user;
            const p = await fetchProfile(u.id);
            if (p) {
              applySession({ id: u.id, email: u.email!, profile: p }, p);
            }
          }
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch {}
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [applySession, fetchProfile]);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
