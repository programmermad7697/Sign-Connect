"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/useAuth";

type Call = { id: string; callerName: string; createdAt?: Timestamp | null };

export default function IncomingCall() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "calls"),
      where("calleeId", "==", user.uid),
      where("status", "==", "ringing")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const now = Date.now();
      const fresh = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Call, "id">) }))
        .filter((c) => !c.createdAt || now - c.createdAt.toMillis() < 45000);
      setCall(fresh[0] ?? null);
    });
    return unsubscribe;
  }, [user]);

  const activeCall = user ? call : null;
  const activeId = activeCall?.id;

  useEffect(() => {
    if (!activeId) return;
    navigator.vibrate?.([300, 200, 300, 200, 300]);
    const timeout = setTimeout(() => setCall(null), 45000);
    return () => clearTimeout(timeout);
  }, [activeId]);

  if (!activeCall || pathname.startsWith("/call/")) return null;

  const { id, callerName } = activeCall;

  async function accept() {
    await updateDoc(doc(db, "calls", id), { status: "accepted", answeredAt: serverTimestamp() });
    router.push(`/call/${id}`);
  }

  async function decline() {
    await updateDoc(doc(db, "calls", id), { status: "declined" });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black/90 p-6 text-white">
      <div className="h-32 w-32 animate-pulse rounded-full bg-green-500" />
      <p className="text-center text-3xl font-bold">{callerName} is calling...</p>
      <div className="flex gap-6">
        <button
          onClick={decline}
          className="rounded-full bg-red-600 px-8 py-4 text-xl hover:bg-red-700"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="rounded-full bg-green-600 px-8 py-4 text-xl hover:bg-green-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}