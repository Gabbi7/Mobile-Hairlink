const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    console.log('--- Incoming Request to /me ---');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData?.user) {
      console.warn('Supabase Auth Error or User Missing:', authError);
      return res.status(401).json({ message: 'Unauthorized session' });
    }
    
    if (!authData.user.email) {
      console.warn('User has no email in Supabase Auth:', authData.user);
      return res.status(401).json({ message: 'Invalid user session (no email)' });
    }

    console.log('Authenticated user:', authData.user.email);

    let { data: user, error } = await supabase
      .from('users')
      .select('id, name, first_name, last_name, email, role, is_active')
      .eq('email', authData.user.email)
      .single();

    // If they exist in Supabase Auth but not in public.users, auto-create them!
    if (error && error.code === 'PGRST116') {
      console.log(`Auto-provisioning public.users profile for ${authData.user.email}...`);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.full_name || 'User',
          first_name: authData.user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name: authData.user.user_metadata?.full_name?.split(' ')[1] || '',
          role: (authData.user.user_metadata?.role || 'donor').toLowerCase(),
          is_active: true,
          updated_at: new Date().toISOString()
        }])
        .select('id, name, first_name, last_name, email, role, is_active')
        .single();
        
      if (insertError) {
        console.error('Failed to auto-create user profile in public.users:', insertError);
        // We still let them through if the Supabase session is valid!
        // The /me endpoint will handle the missing profile gracefully.
        user = { 
          id: authData.user.id, 
          email: authData.user.email, 
          role: (authData.user.user_metadata?.role || 'donor').toLowerCase(),
          is_active: true,
          name: authData.user.user_metadata?.full_name || 'New User'
        };
      } else {
        user = newUser;
        console.log('Successfully auto-provisioned profile.');
      }
    } else if (error || !user) {
      console.error('Database query error in auth middleware:', error);
      return res.status(401).json({ message: 'User profile error' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT/Supabase Auth Error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
