const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

exports.login = async (req, res) => {
  return res.status(400).json({
    message: 'This login endpoint is deprecated. The mobile app now authenticates directly via Supabase Auth.'
  });
};

exports.logout = (req, res) => {
  // JWT is stateless, so we just return success
  res.json({ message: 'Logged out successfully' });
};

exports.me = (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, role } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: first_name || req.user.first_name,
        last_name: last_name || req.user.last_name,
        name: first_name && last_name ? `${first_name} ${last_name}` : req.user.name,
        phone: phone || req.user.phone,
        role: role ? role.toLowerCase() : req.user.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Also update Supabase Auth metadata if role changed
    if (role) {
      // First get the latest metadata from Auth
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { ...(authUser?.user_metadata || {}), role: role.toLowerCase() }
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
