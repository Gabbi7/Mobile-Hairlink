const supabase = require('../config/supabase');
const { sendPushNotification } = require('../services/expoPush.service');

/**
 * Get active push tokens for a user
 */
async function getUserPushTokens(userId) {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !data) return [];
  return data.map(r => r.expo_push_token);
}

/**
 * Create a notification record in Supabase and optionally send a push notification.
 */
async function createNotification(userId, { title, message, type = 'general', data = {} }) {
  // 1. Insert into notifications table
  const { error: dbError } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);

  if (dbError) {
    console.error('[NotificationService] DB insert error:', dbError.message);
  }

  // 2. Send push notification if user has active tokens
  try {
    const tokens = await getUserPushTokens(userId);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, { title, body: message, data });
    }
  } catch (pushError) {
    console.error('[NotificationService] Push error:', pushError.message);
    // Push failure must NOT block the main response
  }
}

module.exports = { createNotification };
