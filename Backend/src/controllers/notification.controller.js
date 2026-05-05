const supabase = require('../config/supabase');

// POST /mobile-api/push-token
exports.saveToken = async (req, res) => {
  const userId = req.user.id;
  const { expo_push_token, platform } = req.body;

  if (!expo_push_token) {
    return res.status(422).json({ message: 'expo_push_token is required.' });
  }

  try {
    // Upsert: if this device already has a token, update it; otherwise insert
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        expo_push_token,
        platform: platform || 'unknown',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'expo_push_token' });

    if (error) throw error;

    res.json({ message: 'Push token saved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving push token', error: error.message });
  }
};

// GET /mobile-api/notifications
exports.index = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// POST /mobile-api/notifications/:id/read
exports.markRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification', error: error.message });
  }
};

// POST /mobile-api/notifications/read-all
exports.markAllRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications', error: error.message });
  }
};
