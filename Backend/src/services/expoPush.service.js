const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

/**
 * Send a push notification to one or more Expo push tokens.
 * @param {string[]} pushTokens - Array of Expo push tokens
 * @param {object} notification - { title, body, data }
 */
async function sendPushNotification(pushTokens, { title, body, data = {} }) {
  const messages = [];

  for (const pushToken of pushTokens) {
    // Validate token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`[PushService] Not a valid Expo push token: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  if (messages.length === 0) return;

  // Expo recommends chunking large sends
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      ticketChunk.forEach((ticket, idx) => {
        if (ticket.status === 'error') {
          console.error(`[PushService] Error sending to ${messages[idx].to}:`, ticket.message);
        }
      });
    } catch (error) {
      console.error('[PushService] Error sending chunk:', error);
    }
  }
}

module.exports = { sendPushNotification };
