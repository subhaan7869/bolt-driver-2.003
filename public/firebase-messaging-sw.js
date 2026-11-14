/* global firebase, importScripts, self, clients */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDmwvoUiiZzEczlqECyDtmT0zgGfgxrfI8',
  authDomain: 'gen-lang-client-0366765118.firebaseapp.com',
  projectId: 'gen-lang-client-0366765118',
  storageBucket: 'gen-lang-client-0366765118.firebasestorage.app',
  messagingSenderId: '995296667219',
  appId: '1:995296667219:web:a04c6a6b5ef85727eec8a6',
});

const messaging = firebase.messaging();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'New Ride Request Available';
  const body =
    payload.notification?.body || payload.data?.body || 'Soho • £14.50 • 1.2 km away';
  const orderId = payload.data?.orderId || '';

  return self.registration.showNotification(title, {
    body,
    icon: 'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png',
    badge: 'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: orderId || 'new-order',
    renotify: true,
    data: { url: '/', orderId },
    actions: [
      { action: 'accept', title: 'Accept ✅' },
      { action: 'decline', title: 'Decline ❌' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId || '';
  const targetUrl =
    event.action === 'accept'
      ? `/?action=accept&orderId=${orderId}`
      : event.action === 'decline'
      ? `/?action=decline&orderId=${orderId}`
      : `/?action=view&orderId=${orderId}`;

  const absoluteUrl = new URL(targetUrl, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CALLBACK',
            action: event.action || 'view',
            orderId,
          });
          if ('navigate' in client) {
            client.navigate(absoluteUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(absoluteUrl);
    })
  );
});
