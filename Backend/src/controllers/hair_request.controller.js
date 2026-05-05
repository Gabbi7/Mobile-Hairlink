const supabase = require('../config/supabase');
const path = require('path');
const { createNotification } = require('../services/notification.service');


const uploadToSupabase = async (file, folder) => {
  if (!file) return null;
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname) || '.jpg';
  const filePath = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

  const { data, error } = await supabase.storage
    .from('hair_requests')
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
    const { data: requestRows, error } = await supabase
      .from('hair_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('hair_requests').getPublicUrl('');
    const baseUrl = publicUrlData.publicUrl;

    const hairRequests = requestRows.map(r => ({
      ...r,
      user: req.user,
      medical_certificate_url: r.medical_certificate ? `${baseUrl}${r.medical_certificate}` : null,
      additional_photo_url: r.additional_photo ? `${baseUrl}${r.additional_photo}` : null,
    }));

    res.json(hairRequests);
  } catch (error) {
    res.status(500).json({ message: 'Database error fetching hair requests', error: error.message });
  }
};

exports.store = async (req, res) => {
  const userId = req.user.id;
  const {
    reference,
    story,
    wig_length,
    wig_color,
    notes,
  } = req.body;

  try {
    const medicalCertFile = req.files && req.files['medical_certificate'] ? req.files['medical_certificate'][0] : null;
    const additionalPhotoFile = req.files && req.files['additional_photo'] ? req.files['additional_photo'][0] : null;

    const medicalCertPath = await uploadToSupabase(medicalCertFile, 'medical_certificates');
    const additionalPhotoPath = await uploadToSupabase(additionalPhotoFile, 'reference_photos');

    const { data, error } = await supabase
      .from('hair_requests')
      .insert([{
        user_id: userId,
        reference: reference || `REQ-${Date.now()}`,
        story: story,
        wig_length: wig_length,
        wig_color: wig_color,
        medical_certificate: medicalCertPath,
        additional_photo: additionalPhotoPath,
        notes: notes,
        status: 'Submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget notification
    createNotification(userId, {
      title: 'Wig request submitted',
      message: 'Your wig request has been submitted successfully. Our team will review your application.',
      type: 'wig',
    }).catch(console.error);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error processing hair request', error: error.message });
  }
};

exports.show = async (req, res) => {
  const reference = req.params.reference;
  const userId = req.user.id;

  try {
    const { data: hairRequest, error } = await supabase
      .from('hair_requests')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', userId)
      .single();

    if (error || !hairRequest) {
      return res.status(404).json({ message: 'Hair request not found' });
    }

    const { data: publicUrlData } = supabase.storage.from('hair_requests').getPublicUrl('');
    const baseUrl = publicUrlData.publicUrl;

    hairRequest.medical_certificate_url = hairRequest.medical_certificate ? `${baseUrl}${hairRequest.medical_certificate}` : null;
    hairRequest.additional_photo_url = hairRequest.additional_photo ? `${baseUrl}${hairRequest.additional_photo}` : null;

    res.json(hairRequest);
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
};
