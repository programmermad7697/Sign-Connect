"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWithGoogle() {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const u = result.user;

      await setDoc(
        doc(db, "users", u.uid),
        {
          name: u.displayName,
          email: u.email?.toLowerCase(),
          photoURL: u.photoURL,
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/contacts");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-50">
      {/* Background decoration */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">

        {/* Brand */}
        <div className="mb-7 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold shadow-lg shadow-blue-500/20">
            SC
          </div>
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
          Welcome back
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          SignConnect
        </h1>

        <p className="mt-3 text-slate-400">
          Sign in to continue
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          onClick={loginWithGoogle}
          className="mt-8 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21.805 10.023H12v3.955h5.64c-.243 1.272-.973 2.348-2.075 3.072v2.55h3.36c1.967-1.812 3.102-4.482 3.102-7.668 0-.73-.08-1.433-.222-2.09Z"
                  fill="currentColor"
                />
                <path
                  d="M12 22c2.805 0 5.16-.93 6.88-2.5l-3.36-2.55c-.93.624-2.12.998-3.52.998-2.71 0-5.008-1.83-5.832-4.292H2.694v2.63A10.4 10.4 0 0 0 12 22Z"
                  fill="currentColor"
                  opacity=".8"
                />
                <path
                  d="M6.168 13.656A6.25 6.25 0 0 1 5.84 11.75c0-.662.114-1.305.328-1.906v-2.63H2.694A10.4 10.4 0 0 0 1.6 11.75c0 1.677.4 3.26 1.094 4.63l3.474-2.724Z"
                  fill="currentColor"
                  opacity=".65"
                />
                <path
                  d="M12 5.552c1.53 0 2.904.526 3.983 1.558l2.986-2.986C17.155 2.527 14.8 1.5 12 1.5a10.4 10.4 0 0 0-9.306 5.714l3.474 2.63C6.992 7.382 9.29 5.552 12 5.552Z"
                  fill="currentColor"
                  opacity=".9"
                />
              </svg>

              Continue with Google
            </>
          )}
        </button>

        <p className="mt-7 text-xs leading-5 text-slate-500">
          By continuing, you agree to use SignConnect responsibly
          and respectfully.
        </p>
      </div>
    </main>
  );
}
