const express = require('express');
const { Webhook } = require('@farcaster/miniapp-node');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

if (!process.env.NEYNAR_API_KEY) {
  throw new Error('NEYNAR_API_KEY is not set');
}

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const wh = new Webhook(process.env.NEYNAR_API_KEY);

app.post('/api/notifications/webhook', async (req, res) => {
  try {
    const signedRequest = req.body;
    const { isValid, webhookEvent } = wh.verifySignedWebhook(signedRequest);

    if (!isValid || !webhookEvent) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    console.log('Received valid webhook event:', JSON.stringify(webhookEvent, null, 2));

    if (webhookEvent.type === 'notifications_enabled') {
      const { userId, notificationToken, notificationUrl } = webhookEvent.data;

      if (!userId || !notificationToken || !notificationUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO notification_tokens (user_id, notification_token, notification_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET
             notification_token = EXCLUDED.notification_token,
             notification_url = EXCLUDED.notification_url,
             created_at = CURRENT_TIMESTAMP`,
          [userId, notificationToken, notificationUrl]
        );
        console.log(`Stored/Updated token for user ${userId} in PostgreSQL`);
      } finally {
        client.release();
      }

      const notification = {
        notification: {
          title: '👋 Welcome to Shield!',
          body: 'Your secure sharing journey begins now! 🚀',
          targetUrl: 'https://shield-app.vercel.app'
        },
        notificationToken: notificationToken
      };

      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to send notification:', response.status, errorBody);
      } else {
        console.log('Successfully sent welcome notification.');
      }
    } else if (webhookEvent.type === 'notifications_disabled' || webhookEvent.type === 'miniapp_removed') {
      const { userId } = webhookEvent.data;
      const client = await pool.connect();
      try {
        await client.query('DELETE FROM notification_tokens WHERE user_id = $1', [userId]);
        console.log(`Removed token for user ${userId} from PostgreSQL`);
      } finally {
        client.release();
      }
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
