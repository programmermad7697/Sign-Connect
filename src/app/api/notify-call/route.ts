import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAuth,
  getAdminDb,
  getAdminMessaging,
} from "../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!idToken) {
      return NextResponse.json(
        { error: "Not signed in" },
        { status: 401 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();

    const decoded = await adminAuth.verifyIdToken(idToken);

    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json(
        { error: "Missing callId" },
        { status: 400 }
      );
    }

    const callSnap = await adminDb.doc(`calls/${callId}`).get();
    const call = callSnap.data();

    if (!call || call.callerId !== decoded.uid) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    const devices = await adminDb
      .collection(`users/${call.calleeId}/devices`)
      .get();

    const tokens = devices.docs
      .map((doc) => doc.data().token)
      .filter(
        (token): token is string =>
          typeof token === "string" && token.length > 0
      );

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const result = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        callId: String(callId),
        callerName: String(call.callerName ?? "Someone"),
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "45",
        },
      },
    });

    await Promise.all(
      result.responses.map((response, index) => {
        if (
          !response.success &&
          response.error?.code ===
            "messaging/registration-token-not-registered"
        ) {
          return adminDb
            .doc(
              `users/${call.calleeId}/devices/${tokens[index]}`
            )
            .delete();
        }

        return undefined;
      })
    );

    return NextResponse.json({
      sent: result.successCount,
    });
  } catch (error) {
    console.error("notify-call failed:", error);

    return NextResponse.json(
      { error: "Could not send notification" },
      { status: 500 }
    );
  }
}