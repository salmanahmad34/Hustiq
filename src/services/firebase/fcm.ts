import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { supabase } from '@/services/supabase/supabaseClient'
import { isSupabaseConfigured } from '@/services/supabase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAGNHEZ4s4r5b-s3QrGqaD__0NI8x3JQto',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hirix-cd2a2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hirix-cd2a2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hirix-cd2a2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '437122380749',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:437122380749:web:9d5d1a14e3db8ea0c18a84',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0ZJWWL7YDJ'
}

console.log("Firebase Config:", firebaseConfig)

// Initialize Firebase App
const app = initializeApp(firebaseConfig)
console.log("Firebase App Initialized")

let messaging: any = null

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app)
    console.log("FCM Messaging Initialized")
  }
} catch (err) {
  console.warn('[FCM] Firebase Messaging is not supported or failed to initialize:', err)
}

/**
 * Register FCM Service Worker, Request notification permissions,
 * Generate push token, save it to Supabase, and setup foreground listener.
 */
export const registerFCM = async (userId: string, forceRequest = false) => {
  if (typeof window === 'undefined') return

  console.log('[FCM] Current notification permission:', Notification.permission)

  if (!messaging) {
    console.warn('[FCM] Messaging instance not initialized.')
    return
  }

  // If permission is denied, log and stop
  if (Notification.permission === 'denied') {
    console.warn('[FCM] Notification permission is denied. Directing user to browser settings.')
    return
  }

  // If permission is default and we aren't forcing the request, do not trigger prompt
  if (Notification.permission === 'default' && !forceRequest) {
    console.log('[FCM] Notification permission is default and forceRequest is false. Skipping permission prompt.')
    return
  }

  try {
    // 1. Construct dynamic registration parameters to pass config to the service worker
    const params = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAGNHEZ4s4r5b-s3QrGqaD__0NI8x3JQto',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hirix-cd2a2.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hirix-cd2a2',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hirix-cd2a2.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '437122380749',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:437122380749:web:9d5d1a14e3db8ea0c18a84',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0ZJWWL7YDJ'
    }).toString()

    // Register the Service Worker explicitly with the configuration query string
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`, {
      scope: '/'
    })
    console.log('[FCM] Service Worker registered successfully:', registration)

    // 2. Request Notification Permission if default and forced
    let permission: NotificationPermission = Notification.permission
    if (permission === 'default' && forceRequest) {
      permission = await Notification.requestPermission()
      console.log('[FCM] Notification permission request result:', permission)
    }

    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied or not selected:', permission)
      return
    }

    // 3. Generate token using VAPID key
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
    })

    if (token) {
      console.log('[FCM] Token generated successfully:', token)
      console.log("FCM Token:", token)
      
      const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-') || userId.startsWith('00000000-')
      if (isSupabaseConfigured() && !isMock) {
        // 4. Save token to Supabase user_push_tokens table
        const { error } = await (supabase as any)
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            token: token,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('[FCM] Error saving token to Supabase:', error.message)
        } else {
          console.log('[FCM] Token successfully persisted in Supabase table user_push_tokens')
        }
      } else {
        console.log('[FCM] Skipping token persistence for mock or unconfigured database session.')
      }
    } else {
      console.warn('[FCM] No registration token returned.')
    }

    // 5. Handle foreground notifications
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload)
      
      const { notification, data } = payload
      if (notification) {
        // Trigger a global UI toast
        import('@/store/uiStore').then(({ useUiStore }) => {
          useUiStore.getState().addToast(notification.title || 'New alert', 'success')
        }).catch(err => console.warn('[FCM] Could not trigger toast:', err))

        // Save notification into our local state/store
        import('@/store/useNotifications').then(({ useNotifications }) => {
          useNotifications.getState().addNotification({
            title: notification.title || 'HustiQ Alert',
            message: notification.body || '',
            type: (data?.type || 'system') as any,
            isPriority: data?.isPriority === 'true',
            category: 'today',
            role: (data?.role || 'student') as any,
            actionPath: data?.actionPath,
            actionText: data?.actionText
          }, userId)
        }).catch(err => console.warn('[FCM] Could not add notification to store:', err))
      }
    })

  } catch (err) {
    console.error('[FCM] Error occurred during registration:', err)
  }
}

export const getCurrentFCMToken = async () => {
  if (!messaging) {
    console.warn('[FCM] Messaging instance not initialized.')
    return null
  }
  try {
    const params = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAGNHEZ4s4r5b-s3QrGqaD__0NI8x3JQto',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hirix-cd2a2.firebaseapp.com',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hirix-cd2a2',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hirix-cd2a2.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '437122380749',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:437122380749:web:9d5d1a14e3db8ea0c18a84',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0ZJWWL7YDJ'
    }).toString()

    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`, {
      scope: '/'
    })
    
    return await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BBpwYQI_YWgz2okGHhYInJ1WjvV_KQWEl56mkfwBLTDrl-7XWH7Gyvvw3-FIZd9GH15fziEBb-ZK00yJ05Tl-X8'
    })
  } catch (err) {
    console.error('[FCM] Error getting current token:', err)
    return null
  }
}

