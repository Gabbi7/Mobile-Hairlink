const supabase = require('../config/supabase');
const path = require('path');
const { createNotification } = require('../services/notification.service');


const uploadToSupabase = async (file, folder) => {
  if (!file) return null;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname) || '.jpg';
  const filePath = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

  const { data, error } = await supabase.storage
    .from('donations')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload file');
  }

  return filePath;
};

exports.index = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: hairRows, error: hairError } = await supabase
      .from('donations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (hairError) throw hairError;

    const { data: monetaryRows, error: monetaryError } = await supabase
      .from('monetary_donations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (monetaryError) throw monetaryError;

    const { data: publicUrlData } = supabase.storage.from('donations').getPublicUrl('');
    const baseUrl = publicUrlData.publicUrl;

    const hairDonations = hairRows.map(d => ({
      ...d,
      donation_type: 'hair',
      type: 'hair',
      treated_hair: d.treated_hair === true,
      user: req.user,
      photo_front_url: d.photo_front ? `${baseUrl}${d.photo_front}` : null,
      photo_side_url: d.photo_side ? `${baseUrl}${d.photo_side}` : null,
    }));

    const monetaryDonations = monetaryRows.map(d => ({
      ...d,
      donation_type: 'monetary',
      type: 'monetary',
      anonymous: d.anonymous === true,
      user: req.user,
      proof_path_url: d.proof_path ? `${baseUrl}${d.proof_path}` : null,
    }));

    const combined = [...hairDonations, ...monetaryDonations].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: 'Database error fetching donations', error: error.message });
  }
};

exports.store = async (req, res) => {
  const type = req.body.type || 'hair';
  const userId = req.user.id;

  try {
    if (type === 'monetary') {
      const {
        reference,
        full_name,
        amount,
        words_amount,
        anonymous,
      } = req.body;

      const file = req.files && req.files['proof_photo'] ? req.files['proof_photo'][0] : null;
      const proofPath = await uploadToSupabase(file, 'monetary');

      const { data, error } = await supabase
        .from('monetary_donations')
        .insert([{
          user_id: userId,
          name: full_name,
          amount: parseFloat(amount),
          currency: 'PHP',
          payment_method: 'Mobile App',
          reference_number: reference,
          proof_path: proofPath,
          status: 'Submitted',
          remarks: words_amount,
          anonymous: anonymous === '1'
        }])
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget notification
      createNotification(userId, {
        title: 'Monetary donation submitted',
        message: `Your monetary donation of PHP ${amount} has been submitted and is under review.`,
        type: 'monetary_donation',
      }).catch(console.error);

      res.status(201).json(data);

    } else {
      // Hair Donation
      const {
        reference,
        hair_length,
        hair_color,
        treated_hair,
        address,
        reason,
      } = req.body;

      const frontFile = req.files && req.files['photo_front'] ? req.files['photo_front'][0] : null;
      const sideFile = req.files && req.files['photo_side'] ? req.files['photo_side'][0] : null;

      const photoFront = await uploadToSupabase(frontFile, 'photos');
      const photoSide = await uploadToSupabase(sideFile, 'photos');

      const { data, error } = await supabase
        .from('donations')
        .insert([{
          user_id: userId,
          reference: reference,
          hair_length: hair_length,
          hair_color: hair_color,
          treated_hair: treated_hair === '1',
          address: address,
          reason: reason,
          status: 'Submitted',
          photo_front: photoFront,
          photo_side: photoSide
        }])
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget notification
      createNotification(userId, {
        title: 'Hair donation submitted',
        message: 'Your hair donation has been submitted successfully. We will review it shortly.',
        type: 'hair_donation',
      }).catch(console.error);

      res.status(201).json(data);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing donation', error: error.message });
  }
};

exports.show = async (req, res) => {
  const reference = req.params.reference;
  const userId = req.user.id;

  try {
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .single();

    if (donation) return res.json(donation);

    const { data: monetaryDonation, error: monetaryError } = await supabase
      .from('monetary_donations')
      .select('*')
      .eq('reference_number', reference)
      .eq('user_id', userId)
      .single();

    if (monetaryDonation) return res.json(monetaryDonation);

    res.status(404).json({ message: 'Donation not found' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
};
