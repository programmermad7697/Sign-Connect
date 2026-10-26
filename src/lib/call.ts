import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";

export async function createCall(user: User, calleeId: string, calleeName: string) {
  const ref = await addDoc(collection(db, "calls"), {
    callerId: user.uid,
    callerName: user.displayName ?? user.email,
    calleeId,
    calleeName,
    status: "ringing",
    createdAt: serverTimestamp(),
  });

  const idToken = await user.getIdToken();
  fetch("/api/notify-call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ callId: ref.id }),
  }).catch(() => {});

  return ref.id;
}