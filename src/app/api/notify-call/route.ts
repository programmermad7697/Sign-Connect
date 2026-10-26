import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminMessaging } from "../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);

    const { callId } = await req.json();
    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    const callSnap = await adminDb.doc(`calls/${callId}`).get();
    const call = callSnap.data();
    if (!call || call.callerId !== decoded.uid) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const devices = await adminDb.collection(`users/${call.calleeId}/devices`).get();
    const tokens = devices.docs.map((d) => d.data().token as string);
    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const result = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        callId: String(callId),
        callerName: String(call.callerName ?? "Someone"),
      },
      webpush: { headers: { Urgency: "high", TTL: "45" } },
    });

    await Promise.all(
      result.responses.map((r, i) =>
        !r.success && r.error?.code === "messaging/registration-token-not-registered"
          ? adminDb.doc(`users/${call.calleeId}/devices/${tokens[i]}`).delete()
          : undefined
      )
    );

    return NextResponse.json({ sent: result.successCount });
  } catch (err) {
    console.error("notify-call failed:", err);
    return NextResponse.json({ error: "Could not send notification" }, { status: 500 });
  }
}