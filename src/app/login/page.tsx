"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import {  doc, setDoc, serverTimestamp } from "firebase/firestore"

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
        setError(err instanceof Error ? err.message : "An error occurred during login.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-neutral-900 dark:bg-slate-900 dark:text-slate-50">
      <h1 className="text-3xl font-bold">SignConnect</h1>
      <p className="text-lg">Sign in to continue</p>

      {error && <p className="max-w-sm text-center text-red-500">{error}</p>}

      <button
        disabled={loading}
        onClick={loginWithGoogle}
        className="rounded-lg bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
    </main>
  );
}