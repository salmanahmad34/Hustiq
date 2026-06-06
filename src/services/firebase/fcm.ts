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

// Validate critical Firebase configuration parameters
const missingKeys: string[] = []
if (!firebaseConfig.projectId) missingKeys.push('projectId')
if (!firebaseConfig.messagingSenderId) missingKeys.push('messagingSenderId')
if (!firebaseConfig.appId) missingKeys.push('appId')

if (missingKeys.length > 0) {
  console.error(`[FCM] Missing critical Firebase Configuration values: ${missingKeys.join(', ')}. FCM will not function properly.`)
} else {
  console.log('[FCM] Critical Firebase configuration parameters validated successfully.')
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)
console.log("Firebase App Initialized")

let messaging: any = null

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app)
    console.log('[FCM] Messaging service initialized successfully.')
  }
} catch (err) {
  console.log('[FCM] Push notifications are not supported in this browser environment.')
}

/**
 * Register FCM Service Worker, Request notification permissions,
 * Generate push token, save it to Supabase, and setup foreground listener.
 */
export const registerFCM = async (userId: string, forceRequest = false) => {
  if (typeof window === 'undefined') return

  console.log('[FCM] Current notification permission state:', Notification.permission)

  if (Notification.permission === 'denied') {
    console.log('[FCM] Notification permission is denied by the user. Skipping token registration.')
    return
  }

  // If permission is default and we aren't forcing the request, do not trigger prompt
  if (Notification.permission === 'default' && !forceRequest) {
    console.log('[FCM] Notification permission is default and not requested. Skipping prompt.')
    return
  }

  if (!messaging) {
    console.log('[FCM] Messaging is currently unavailable or unsupported.')
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
    console.log('[FCM] Service Worker registered under root scope (/).')

    // 2. Request Notification Permission if default and forced
    let permission: NotificationPermission = Notification.permission
    if (permission === 'default' && forceRequest) {
      permission = await Notification.requestPermission()
      console.log('[FCM] Requesting notification permission. Result:', permission)
    }

    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was not granted (status:', permission + ')')
      return
    }

    // 3. Generate token using VAPID key
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
    })

    if (token) {
      console.log('[FCM] Token resolved successfully.')
      console.log("FCM Token:", token)
      
      const isMock = !userId || userId.startsWith('mock-') || userId.startsWith('demo-')
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
          console.log('[FCM] Supabase database sync warning:', error.message)
        } else {
          console.log('[FCM] Device token synchronized in Supabase user_push_tokens table.')
        }
      } else {
        console.log('[FCM] Database synchronization skipped (mock or guest user session).')
      }
    } else {
      console.log('[FCM] Device registration token is currently empty.')
    }

    // 5. Handle foreground notifications
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground notification received:', payload)
      
      const { notification, data } = payload
      if (notification) {
        // Trigger a global UI toast
        import('@/store/uiStore').then(({ useUiStore }) => {
          useUiStore.getState().addToast(notification.title || 'New alert', 'success')
        }).catch(() => console.log('[FCM] Dynamic UI toast could not be loaded.'))

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
        }).catch(() => console.log('[FCM] Notification store update skipped.'))
      }
    })

  } catch (err) {
    console.log('[FCM] Device registration completed with warning.')
  }
}

export const getCurrentFCMToken = async () => {
  if (typeof window === 'undefined') return null
  
  if (Notification.permission !== 'granted') {
    console.log('[FCM] Notification permission is not granted. Skipping token request.')
    return null
  }

  if (!messaging) {
    console.log('[FCM] Messaging is currently unavailable.')
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
    console.log('[FCM] Registration token is currently unavailable.')
    return null
  }
}

export const sendTestNotification = async (userId: string): Promise<any> => {
  try {
    const res = await fetch(`/api/test-notification?userId=${userId}`)
    let data: any
    try {
      data = await res.json()
    } catch (parseErr) {
      throw new Error('Failed to parse server response')
    }

    if (!res.ok || (data && data.error)) {
      const errorObj = data?.error
      const errorMsg = typeof errorObj === 'object' && errorObj
        ? (errorObj.message || JSON.stringify(errorObj))
        : (errorObj || 'Failed to send test notification')
      throw new Error(errorMsg)
    }
    return data
  } catch (err: any) {
    console.log('[FCM sendTestNotification] Failed:', err.message || err)
    throw err
  }
}

