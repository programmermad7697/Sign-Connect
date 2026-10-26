"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  where,
  type QuerySnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/useAuth";
import { createCall } from "../../lib/call";

type CallData = {
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName?: string;
  status: string;
  createdAt?: Timestamp | null;
  answeredAt?: Timestamp | null;
  endedAt?: Timestamp | null;
};

type Row = {
  id: string;
  direction: "in" | "out";
  otherId: string;
  otherName: string;
  label: string;
  missed: boolean;
  when: number;
};

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function toRow(id: string, c: CallData, uid: string, now: number): Row {
  const out = c.callerId === uid;
  const created = c.createdAt?.toMillis() ?? now;

  let status = c.status;
  if (status === "ringing" && now - created > 60000) status = "missed";

  let label = "";
  let missed = false;

  if (status === "missed") {
    label = out ? "No answer" : "Missed call";
    missed = !out;
  } else if (status === "declined") {
    label = out ? "Declined" : "You declined";
  } else if (status === "ringing") {
    label = "Ringing...";
  } else {
    const secs =
      c.answeredAt && c.endedAt
        ? Math.round((c.endedAt.toMillis() - c.answeredAt.toMillis()) / 1000)
        : null;
    label = secs !== null ? `Answered · ${formatDuration(secs)}` : "Answered";
  }

  return {
    id,
    direction: out ? "out" : "in",
    otherId: out ? c.calleeId : c.callerId,
    otherName: out ? (c.calleeName ?? "Unknown") : c.callerName,
    label,
    missed,
    when: created,
  };
}

export default function History() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [outgoing, setOutgoing] = useState<Row[]>([]);
  const [incoming, setIncoming] = useState<Row[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const handle = (setter: (rows: Row[]) => void) => (snap: QuerySnapshot) => {
      const now = Date.now();
      setter(snap.docs.map((d) => toRow(d.id, d.data() as CallData, uid, now)));
    };

    const stopOut = onSnapshot(
      query(collection(db, "calls"), where("callerId", "==", uid)),
      handle(setOutgoing)
    );
    const stopIn = onSnapshot(
      query(collection(db, "calls"), where("calleeId", "==", uid)),
      handle(setIncoming)
    );

    return () => {
      stopOut();
      stopIn();
    };
  }, [user]);

  async function callBack(r: Row) {
    if (!user) return;
    const id = await createCall(user, r.otherId, r.otherName);
    router.push(`/call/${id}`);
  }

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-neutral-900 dark:bg-slate-900 dark:text-slate-50">
        Loading...
      </main>
    );
  }

  const rows = [...outgoing, ...incoming].sort((a, b) => b.when - a.when);

  return (
    <main className="min-h-screen bg-white p-6 text-neutral-900 dark:bg-slate-900 dark:text-slate-50">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white p-2 rounded">Call history</h1>
        <Link href="/contacts" className="text-blue-600 dark:text-blue-400">
          Back to contacts
        </Link>
      </div>

      <ul className="space-y-3">
        {rows.length === 0 && <li className="opacity-70">No calls yet.</li>}
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg bg-gray-100 p-4 dark:bg-slate-800"
          >
            <div>
              <p className={`text-lg ${r.missed ? "text-red-500" : ""}`}>
                {r.direction === "out" ? "↗" : "↙"} {r.otherName}
              </p>
              <p className={`text-sm ${r.missed ? "text-red-500" : "opacity-70"}`}>
                {r.label} ·{" "}
                {new Date(r.when).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <button
              onClick={() => callBack(r)}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Call back
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}