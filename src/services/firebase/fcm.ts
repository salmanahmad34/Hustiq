import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { supabase } from '@/services/supabase/supabaseClient'
import { isSupabaseConfigured } from '@/services/supabase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)
let messaging: any = null

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app)
  }
} catch (err) {
  console.warn('[FCM] Firebase Messaging is not supported or failed to initialize:', err)
}

/**
 * Register FCM Service Worker, Request notification permissions,
 * Generate push token, save it to Supabase, and setup foreground listener.
 */
export const registerFCM = async (userId: string) => {
  if (!messaging) {
    console.warn('[FCM] Messaging instance not initialized.')
    return
  }

  try {
    // 1. Construct dynamic registration parameters to pass config to the service worker
    const params = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
    }).toString()

    // Register the Service Worker explicitly with the configuration query string
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`, {
      scope: '/'
    })
    console.log('[FCM] Service Worker registered successfully:', registration)

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission()
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
