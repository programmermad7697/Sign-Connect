"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../lib/useAuth";

export default function CallPage() {
  const { callId } = useParams<{ callId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ringing");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !callId) return;

    async function getToken() {
      try {
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room: callId,
            identity: user!.uid,
            name: user!.displayName ?? user!.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not get token");
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    getToken();
  }, [user, callId]);

  useEffect(() => {
    if (!user || !callId) return;
    const unsubscribe = onSnapshot(doc(db, "calls", callId), (snap) => {
      const s = snap.data()?.status;
      if (!s) return;
      setStatus(s);
      if (s === "declined" || s === "ended" || s === "missed") {
        router.replace("/contacts");
      }
    });
    return unsubscribe;
  }, [user, callId, router]);

  useEffect(() => {
    if (status !== "ringing" || !callId) return;
    const timeout = setTimeout(() => {
      updateDoc(doc(db, "calls", callId), {
        status: "missed",
        endedAt: serverTimestamp(),
      }).catch(() => {});
    }, 45000);
    return () => clearTimeout(timeout);
  }, [status, callId]);

  async function leave() {
    try {
      const ref = doc(db, "calls", callId);
      const snap = await getDoc(ref);
      const s = snap.data()?.status;
      if (s === "ringing") {
        await updateDoc(ref, { status: "missed", endedAt: serverTimestamp() });
      } else if (s === "accepted") {
        await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
      }
    } catch {}
    router.replace("/contacts");
  }

  if (error) {
    return <main className="p-6 text-red-500">{error}</main>;
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Connecting...
      </main>
    );
  }

  return (
    <>
      {status === "ringing" && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-white">
          Ringing...
        </div>
      )}
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={leave}
        data-lk-theme="default"
        style={{ height: "100vh" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </>
  );
}