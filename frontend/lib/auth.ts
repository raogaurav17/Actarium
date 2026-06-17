// Supabase browser-side auth client
// Used by login/page.tsx for email/password and Google OAuth

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInWithGoogle() {
  const supabase = createSupabaseClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
}

export async function signOut() {
  const supabase = createSupabaseClient();
  return supabase.auth.signOut();
}
