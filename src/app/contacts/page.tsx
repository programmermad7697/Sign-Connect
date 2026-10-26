"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useAuth } from "../../lib/useAuth";
import { enablePush } from "../../lib/push";
import { createCall } from "../../lib/call";
import Link from "next/link";

type Contact = {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
};

export default function Contacts() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        enablePush(user.uid).then(() => setPushOn(true)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "contacts"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setContacts(snap.docs.map((d) => d.data() as Contact));
    });
    return unsubscribe;
  }, [user]);

  async function addContact() {
    if (!user) return;
    const target = email.trim().toLowerCase();
    if (!target) return;

    setAdding(true);
    setMessage("");

    try {
      if (target === user.email?.toLowerCase()) {
        setMessage("That's your own email.");
        return;
      }

      const snap = await getDocs(query(collection(db, "users"), where("email", "==", target)));
      if (snap.empty) {
        setMessage("No user found. They need to log in to SignCall once first.");
        return;
      }

      const found = snap.docs[0];
      const data = found.data();
      await setDoc(doc(db, "users", user.uid, "contacts", found.id), {
        uid: found.id,
        name: data.name ?? target,
        email: data.email,
        photoURL: data.photoURL ?? null,
      });

      setEmail("");
      setMessage(`Added ${data.name ?? target}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

    async function startCall(c: Contact) {
        if (!user) return;
        try {
            const id = await createCall(user, c.uid, c.name);
            router.push(`/call/${id}`);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Could not start the call");
        }
    }

  async function logout() {
    await signOut(auth);
    router.replace("/login");
  }

  async function turnOnPush() {
    if (!user) return;
    try {
        await enablePush(user.uid);
        setPushOn(true);
        setMessage("Call notifications on.");
    } catch (err) {
        setMessage(err instanceof Error ? err.message : "Could not enable push notifications");
    }
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-6 text-slate-50 sm:px-8 lg:px-12">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold shadow-lg shadow-blue-500/20">
                SC
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Contacts
                </h1>
                <p className="text-sm text-slate-400">
                  {user.displayName ?? user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-300"
              >
                Call History
              </Link>

              <button
                onClick={logout}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </div>

          </div>
        </div>

        {/* Notification */}
        {!pushOn && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="font-semibold text-emerald-400">
                Call notifications
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Enable notifications to know when someone calls you.
              </p>
            </div>

            <button
              onClick={turnOnPush}
              className="cursor-pointer rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
            >
              Turn on notifications
            </button>

          </div>
        )}

        {/* Add contact */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:p-6">

          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Add a contact
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Connect with a friend using their Google email.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="email"
              placeholder="Friend's Google email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/70 p-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
            />

            <button
              onClick={addContact}
              disabled={adding}
              className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>

          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {message}
            </div>
          )}

        </div>

        {/* Contacts list */}
        <div>

          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Your Contacts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {contacts.length}{" "}
                {contacts.length === 1 ? "contact" : "contacts"}
              </p>
            </div>
          </div>

          <ul className="grid gap-4 md:grid-cols-2">

            {contacts.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center md:col-span-2">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  👥
                </div>

                <p className="font-medium text-slate-300">
                  No contacts yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a friend using their Google email above.
                </p>
              </li>
            )}

            {contacts.map((c) => (
              <li
                key={c.uid}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
              >

                <div className="flex min-w-0 items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold shadow-lg shadow-blue-500/20">
                    {c.name
                      ? c.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-100">
                      {c.name}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {c.email}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => startCall(c)}
                  className="ml-4 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5"
                >
                  <span>☎</span>
                  Call
                </button>

              </li>
            ))}

          </ul>

        </div>

      </div>
    </main>
  );
}
