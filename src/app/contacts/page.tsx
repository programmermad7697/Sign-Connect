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
      <main className="flex min-h-screen items-center justify-center bg-white text-neutral-900 dark:bg-slate-900 dark:text-slate-50">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-slate-900 dark:text-slate-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm opacity-70">{user.displayName ?? user.email}</p>
        </div>

        <Link href="/history" className="mr-3 text-blue-600 dark:text-blue-400 bg-blue-700/10 hover:bg-blue-700/20 px-4 py-2 rounded-lg cursor-pointer">
          Call History
        </Link>

        <button
          onClick={logout}
          className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800"
        >
          Log out
        </button>
      </div>

      {!pushOn && (
        <button
            onClick={turnOnPush}
            className="mb-4 rounded-lg border border-green-600 px-4 py-2 text-green-600 cursor-pointer hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-slate-800"
        >
            Turn on call notifications
        </button>
      )}

      <div className="mb-2 flex gap-2">
        <input
          type="email"
          placeholder="Friend's Google email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          onClick={addContact}
          disabled={adding}
          className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50  cursor-pointer"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
      {message && <p className="mb-4 text-sm">{message}</p>}

      <ul className="mt-4 space-y-3">
        {contacts.length === 0 && <li className="opacity-70">No contacts yet.</li>}
        {contacts.map((c) => (
          <li
            key={c.uid}
            className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-slate-800"
          >
            <div>
              <p className="text-lg">{c.name}</p>
              <p className="text-sm opacity-70">{c.email}</p>
            </div>
            <button
              onClick={() => startCall(c)}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 cursor-pointer"
            >
              Call
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}