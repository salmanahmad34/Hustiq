import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let firebaseAdminApp = null;
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Format private key correctly to support line breaks
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : null;

  if (projectId && clientEmail && privateKey) {
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    console.log('[Firebase Admin] Initialized successfully');
  } else {
    console.warn('[Firebase Admin] Credentials missing. Admin SDK not initialized.');
  }
} catch (err) {
  console.error('[Firebase Admin] Initialization failed:', err);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('[Supabase Client] SUPABASE_URL or VITE_SUPABASE_URL is missing!');
}

const isPlaceholder = !supabaseServiceKey || 
  supabaseServiceKey === 'your_supabase_service_role_key_here' || 
  supabaseServiceKey.trim() === '';

// Fallback to anon key if service key is missing or is placeholder
const supabaseKey = isPlaceholder ? process.env.VITE_SUPABASE_ANON_KEY : supabaseServiceKey;
if (isPlaceholder) {
  console.warn('[Supabase Client] SUPABASE_SERVICE_ROLE_KEY missing or placeholder. Server will run with anon key.');
} else {
  console.log('[Supabase Client] SUPABASE_SERVICE_ROLE_KEY loaded successfully.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Reusable function to send push notifications to a user via Firebase Admin SDK
 */
export async function sendPushNotification({ userId, title, body, data = {} }) {
  console.log(`[FCM] Notification Sending to User ID: ${userId}`);
  console.log(`[Push Notification] Attempting to send to User ID: ${userId}`);
  console.log(`[Push Notification] Title: "${title}", Body: "${body}"`);
  console.log(`[Push Notification] Payload Data:`, data);

  if (!firebaseAdminApp) {
    console.error('[FCM] Notification Failed: Firebase Admin is not initialized.');
    return { success: false, error: 'Firebase Admin not initialized' };
  }

  try {
    // 1. Fetch user's FCM token(s) from user_push_tokens table
    const { data: tokenRecords, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokenError) {
      console.error('[Push Notification] Error fetching tokens from Supabase:', tokenError.message);
      return { success: false, error: tokenError.message };
    }

    if (!tokenRecords || tokenRecords.length === 0) {
      console.log(`[FCM] Token Found - Count: 0`);
      console.log(`[Push Notification] No registered FCM tokens found for User ID: ${userId}`);
      return { success: true, message: 'No registered tokens found' };
    }

    const tokens = tokenRecords.map(r => r.token);
    console.log(`[FCM] Token Found - Count: ${tokens.length}`);
    console.log(`[Push Notification] Found ${tokens.length} token(s) for User ID: ${userId}:`, tokens);

    // 2. Build and send the multicast message
    const messagePayload = {
      tokens: tokens,
      notification: {
        title: title || 'HustiQ',
        body: body
      },
      data: {
        ...data,
        // Firebase Admin requires all values in data payload to be strings
        ...Object.fromEntries(
          Object.entries(data).map(([key, val]) => [key, String(val)])
        )
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          visibility: 'public'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: title || 'HustiQ',
          body: body,
          icon: '/favicon.svg'
        }
      }
    };

    console.log(`[Push Notification] Sending multicast message via FCM...`);
    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    console.log(`[FCM] Firebase Response:`, JSON.stringify(response));

    // 3. Stale token management: identify and remove stale or invalid tokens
    const tokensToDelete = [];
    response.responses.forEach((resp, idx) => {
      if (resp.success) {
        console.log(`[FCM] Notification Sent successfully to token: "${tokens[idx]}"`);
      } else {
        const error = resp.error;
        console.error(`[FCM] Notification Failed for token: "${tokens[idx]}" Error:`, error);
        
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          console.log(`[Push Notification] Stale or invalid token identified for deletion: "${tokens[idx]}"`);
          tokensToDelete.push(tokens[idx]);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      console.log(`[Push Notification] Deleting ${tokensToDelete.length} stale token(s) from database...`);
      const { error: deleteError } = await supabase
        .from('user_push_tokens')
        .delete()
        .in('token', tokensToDelete);

      if (deleteError) {
        console.error('[Push Notification] Error deleting stale tokens from Supabase:', deleteError.message);
      } else {
        console.log('[Push Notification] Stale tokens successfully deleted from Supabase.');
      }
    }

    return { success: true, response };

  } catch (err) {
    console.error('[FCM] Notification Failed. Unexpected error occurred:', err);
    return { success: false, error: err.message };
  }
}

// Realtime subscription setup
let realtimeChannel = null;

function subscribeToNotifications() {
  if (!supabaseUrl) {
    console.error('[Realtime Listener] Cannot subscribe. Supabase URL missing.');
    return;
  }

  console.log('[Server Realtime] Subscribing to public.notifications inserts...');

  realtimeChannel = supabase
    .channel('server-notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      async (payload) => {
        try {
          console.log('[Server Realtime] Insert detected in public.notifications:', payload);
          const row = payload.new;
          if (!row || !row.user_id) return;

          let notificationBody = row.content || 'You have received a new update.';
          const notificationType = row.type;

          // Map notification contents to the requested notification format strings
          if (notificationType === 'offer_accepted') {
            notificationBody = 'Your application has been accepted.';
          } else if (notificationType === 'offer_rejected') {
            notificationBody = 'Your application was not selected.';
          } else if (notificationType === 'new_message') {
            notificationBody = 'You received a new message.';
          } else if (notificationType === 'system' && (row.title && row.title.includes('Nearby Job'))) {
            notificationBody = 'A new gig is available near your location.';
          } else if (notificationType === 'new_applicant') {
            notificationBody = 'You have received a new job application.';
          } else if (notificationType === 'job_completed') {
            notificationBody = 'Your job has been marked as completed.';
          }

          const notificationTitle = 'HustiQ';

          await sendPushNotification({
            userId: row.user_id,
            title: notificationTitle,
            body: notificationBody,
            data: {
              notificationId: row.id,
              type: row.type || '',
              actionPath: row.metadata?.actionPath || '',
              actionText: row.metadata?.actionText || ''
            }
          });
        } catch (err) {
          console.error('[Server Realtime] Error handling notification event:', err);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Server Realtime] Subscription status: ${status}`);
    });
}

// Start realtime subscription listener
subscribeToNotifications();

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    firebaseAdminInitialized: firebaseAdminApp !== null,
    supabaseConfigured: !!supabaseUrl
  });
});

app.post('/api/send-to-token', async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token || !body) {
    return res.status(400).json({ error: 'Missing token or body in request payload.' });
  }

  console.log(`[FCM] Notification Sending to Token: ${token}`);

  if (!firebaseAdminApp) {
    console.error('[FCM] Notification Failed: Firebase Admin is not initialized.');
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const messagePayload = {
      token: token,
      notification: {
        title: title || 'HustiQ Test',
        body: body
      },
      data: data ? {
        ...data,
        ...Object.fromEntries(
          Object.entries(data).map(([key, val]) => [key, String(val)])
        )
      } : {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          visibility: 'public'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: title || 'HustiQ Test',
          body: body,
          icon: '/favicon.svg'
        }
      }
    };

    console.log(`[Push Notification] Sending single message via FCM to token...`);
    const response = await admin.messaging().send(messagePayload);
    console.log(`[FCM] Firebase Response:`, response);
    console.log(`[Push Notification] Message ID:`, response);

    res.json({ message: 'Notification sent successfully to token.', messageId: response, response });
  } catch (err) {
    console.error('[FCM] Notification Failed. Unexpected error occurred:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/send-notification', async (req, res) => {
  const { userId, title, body, data } = req.body;

  if (!userId || !body) {
    return res.status(400).json({ error: 'Missing userId or body in request payload.' });
  }

  const result = await sendPushNotification({
    userId,
    title,
    body,
    data
  });

  if (result.success) {
    res.json({ message: 'Notification processed successfully.', result });
  } else {
    res.status(500).json({ error: 'Failed to process notification.', details: result });
  }
});

// Test endpoint to trigger a notification to a specific user
app.get('/api/test-notification', async (req, res) => {
  const { userId, title, body } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing "userId" query parameter.' });
  }

  console.log(`[Test Endpoint] Triggering test push notification for user: ${userId}`);
  const result = await sendPushNotification({
    userId,
    title: title || 'HustiQ Test',
    body: body || 'This is a test notification from the HustiQ server.'
  });

  if (result.success) {
    res.json({ message: 'Test notification triggered successfully.', result });
  } else {
    res.status(500).json({ error: 'Failed to trigger test notification.', details: result });
  }
});

// Serve frontend build static files
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route to serve React app for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
  console.log(`[Server] Serving static frontend files from: ${distPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }
  process.exit(0);
});
