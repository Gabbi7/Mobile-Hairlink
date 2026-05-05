const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

exports.login = async (req, res) => {
  const { email, password, device_name } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      message: 'The given data was invalid.',
      errors: {
        email: ['The email and password fields are required.']
      }
    });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(422).json({
      message: 'The given data was invalid.',
      errors: {
        email: ['The provided credentials are incorrect.']
      }
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  
  if (!passwordMatch) {
    return res.status(422).json({
      message: 'The given data was invalid.',
      errors: {
        email: ['The provided credentials are incorrect.']
      }
    });
  }

  if (!user.is_active) {
    return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'hairlink_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user;
  
  // Add dynamic properties if needed (star_points placeholder)
  userWithoutPassword.star_points = 0; 

  res.json({
    token: token,
    user: userWithoutPassword
  });
};

exports.logout = (req, res) => {
  // JWT is stateless, so we just return success
  res.json({ message: 'Logged out successfully' });
};

exports.me = (req, res) => {
  // User is already attached to req by authMiddleware
  const user = req.user;
  user.star_points = 0; // Placeholder
  res.json(user);
};
