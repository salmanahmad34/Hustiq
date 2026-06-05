// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAGNHEZ4s4r5b-s3QrGqaD__0NI8x3JQto",
  authDomain: "hirix-cd2a2.firebaseapp.com",
  projectId: "hirix-cd2a2",
  storageBucket: "hirix-cd2a2.firebasestorage.app",
  messagingSenderId: "437122380749",
  appId: "1:437122380749:web:9d5d1a14e3db8ea0c18a84",
  measurementId: "G-0ZJWWL7YDJ"
};

// Initialize Firebase compat inside the service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background messages handling
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'HustiQ Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have received a new update.',
    icon: '/favicon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
