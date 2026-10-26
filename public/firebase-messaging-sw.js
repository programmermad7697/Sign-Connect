importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDbgpNUYQCARj_AevKGL6bWYGywK1dWBZw",
  authDomain: "sign-connect-28a8b.firebaseapp.com",
  projectId: "sign-connect-28a8b",
  messagingSenderId: "339248795911",
  appId: "1:339248795911:web:08bcb50533c48eadb7f5a2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(`${data.callerName || "Someone"} is calling`, {
    body: "Open SignCall to answer",
    tag: data.callId || "incoming-call",
    requireInteraction: true,
    vibrate: [300, 200, 300, 200, 300],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return clients.openWindow("/contacts");
    })
  );
});