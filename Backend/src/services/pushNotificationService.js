const { Expo } = require('expo-server-sdk');
const supabase = require('../config/supabase');

// Create a new Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

/**
 * Send a push notification to a specific user and save it to the database.
 * @param {string} userId - The UUID of the user
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {object} data - Additional data payload (including reference_url, type, etc.)
 */
async function sendPushNotificationToUser(userId, title, body, data = {}) {
  try {
    // 1. Insert into notifications table
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: body, // Mapping body to message for DB
        type: data.type || 'general',
        reference_url: data.reference_url || null,
        is_read: false,
      })
      .select()
      .single();

    if (notifError) {
      console.error('[PushService] Error saving notification to DB:', notifError);
      throw notifError;
    }

    // 2. Fetch active Expo push tokens for the user
    const { data: tokens, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('expo_push_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tokenError) {
      console.error('[PushService] Error fetching push tokens:', tokenError);
      throw tokenError;
    }

    if (!tokens || tokens.length === 0) {
      console.log(`[PushService] No active push tokens found for user ${userId}. Notification saved only.`);
      return notifData;
    }

    const pushTokens = tokens.map(t => t.expo_push_token);
    const messages = [];

    for (const pushToken of pushTokens) {
      // Basic validation: ensure it looks like an Expo token
      if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
        console.warn(`[PushService] Not a valid Expo push token format: ${pushToken}`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: { ...data, notificationId: notifData.id },
      });
    }

    if (messages.length === 0) return notifData;

    // 3. Send using expo-server-sdk
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

    return notifData;
  } catch (error) {
    console.error('[PushService] Unexpected error:', error);
    throw error;
  }
}

module.exports = { sendPushNotificationToUser };
