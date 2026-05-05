import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import RequestSuccessModal from '../../components/RequestSuccessModal';

const shadows = {
  header: {
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  submit: {
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};

interface HairRequestScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function HairRequestScreen({ onBack, onSuccess }: HairRequestScreenProps) {
  const [story, setStory] = useState('');
  const [hairLength, setHairLength] = useState<'Long' | 'Short' | null>(null);
  const [wigColor, setWigColor] = useState<'Black' | 'Brown' | 'Light' | null>(null);
  const [surveySource, setSurveySource] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  // Image states
  const [docImage, setDocImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Submitting...');
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleSurvey = (val: string) => {
    setSurveySource(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const togglePermission = (val: string) => {
    setPermissions(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const pickImage = async (type: 'doc' | 'ref') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      if (type === 'doc') setDocImage(result.assets[0].uri);
      else setRefImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!story.trim() || !hairLength || !wigColor || !docImage) {
      Alert.alert('Missing Information', 'Please provide your story, specifications, and medical documentation.');
      return;
    }

    setLoading(true);
    setLoadingLabel('Preparing request...');

    try {
      const formData = new FormData();
      formData.append('reference', `REQ-${Date.now()}`);
      formData.append('story', story);
      formData.append('wig_length', hairLength);
      formData.append('wig_color', wigColor);
      
      // Handle Medical Certificate
      const docExt = docImage.split('.').pop() || 'jpg';
      formData.append('medical_certificate', {
        uri: Platform.OS === 'android' ? docImage : docImage.replace('file://', ''),
        name: `medical_cert.${docExt}`,
        type: `image/${docExt === 'jpg' ? 'jpeg' : docExt}`,
      } as any);

      // Handle Reference Photo (Optional)
      if (refImage) {
        const refExt = refImage.split('.').pop() || 'jpg';
        formData.append('additional_photo', {
          uri: Platform.OS === 'android' ? refImage : refImage.replace('file://', ''),
          name: `reference.${refExt}`,
          type: `image/${refExt === 'jpg' ? 'jpeg' : refExt}`,
        } as any);
      }

      // Handle Survey & Permissions (Serialized)
      formData.append('notes', JSON.stringify({
        survey_source: surveySource,
        permissions: permissions
      }));

      setLoadingLabel('Submitting to server...');
      
      const response = await api.post('/hair-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201 || response.status === 200) {
        setShowSuccess(true);
      } else {
        throw new Error('Unexpected server response.');
      }
    } catch (err: any) {
      console.error('Submission error:', err.response?.data || err.message);
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to submit your request. Please try again.');
    } finally {
      setLoading(false);
      setLoadingLabel('Submitting...');
    }
  };

  const CustomCheckbox = ({ label, checked, onPress }: { label: string, checked: boolean, onPress: () => void }) => (
    <TouchableOpacity className="flex-row items-center mb-[14px]" onPress={onPress} activeOpacity={0.7}>
      <View 
        className={`w-[24px] h-[24px] rounded-[8px] border-2 items-center justify-center mr-[12px] ${checked ? 'bg-purple-500 border-purple-500' : 'border-purple-200'}`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text className="text-[#555] font-semibold" style={{ fontSize: ms(14) }}>{label}</Text>
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView 
        className="flex-1 bg-[#F9F4FC]"
        style={{ paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      
      {/* ── Elite Header ──────────────────────────────── */}
      <LinearGradient
        colors={['#8E44AD', '#9B59B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="flex-row items-center justify-between rounded-b-[30px]"
        style={[{ paddingHorizontal: ms(16), paddingVertical: vs(15) }, shadows.header]}
      >
        <TouchableOpacity onPress={onBack} className="items-center justify-center" style={{ width: ms(44), height: ms(44) }}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white/80 font-bold tracking-[1px]" style={{ fontSize: ms(12) }}>Strand Up for Cancer</Text>
          <Text className="text-white font-black" style={{ fontSize: ms(22) }}>Hair Request</Text>
        </View>
        <View style={{ width: 44 }} />
      </LinearGradient>

      {loading && (
        <View className="absolute inset-0 bg-black/60 z-[999] items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-[15px] font-extrabold" style={{ fontSize: ms(16) }}>{loadingLabel}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: ms(16), paddingBottom: vs(50), paddingTop: vs(10) }} showsVerticalScrollIndicator={false}>
        
        {/* ── Your Journey Section ────────────────────── */}
        <Animated.View 
          entering={FadeInDown.delay(100)} 
          className="bg-white rounded-[24px]"
          style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
        >
          <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Your Journey</Text>
          <Text className="text-[#444] font-bold mb-[10px]" style={{ fontSize: ms(15) }}>Please share with us your story/journey*</Text>
          <View className="mb-[15px]">
            {[
              'Cause of Hair Loss',
              'Duration of Hair Loss',
              'Name of Attending Physician (optional)',
              'What has been the most challenging part?',
              'What gives you hope and keeps you going?',
            ].map((item, i) => (
              <View key={i} className="flex-row items-center mb-[6px]">
                <Ionicons name="heart-half" size={14} color="#9B59B6" />
                <Text className="text-[#666] font-medium ml-[8px]" style={{ fontSize: ms(13) }}>{item}</Text>
              </View>
            ))}
          </View>
          <TextInput
            className="bg-purple-50/30 border-[1.5px] border-purple-200 rounded-[18px] text-[#1a1a1a] font-medium"
            style={{ padding: ms(16), height: vs(160), fontSize: ms(15) }}
            placeholder="Write your story here..."
            placeholderTextColor="#999"
            multiline
            value={story}
            onChangeText={setStory}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* ── Documentation Section ───────────────────── */}
        <Animated.View 
          entering={FadeInDown.delay(200)} 
          className="bg-white rounded-[24px]"
          style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
        >
          <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Supporting Documents</Text>
          <Text className="text-[#1a1a1a] font-bold" style={{ fontSize: ms(15) }}>Upload medical certificate or diagnosis *</Text>
          <Text className="text-[#888] mb-[12px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>Any proof that verifies the donee as a patient.</Text>
          
          <TouchableOpacity 
            className="flex-row items-center justify-center border-[1.5px] border-dashed border-purple-500 rounded-[18px] bg-purple-500/5 overflow-hidden" 
            style={{ paddingVertical: vs(14), minHeight: vs(60) }}
            onPress={() => pickImage('doc')}
          >
            {docImage ? (
              <Image source={{ uri: docImage }} className="w-full" style={{ height: vs(160) }} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#9B59B6" />
                <Text className="text-purple-500 font-extrabold ml-[8px]" style={{ fontSize: ms(14) }}>Add File</Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-[#1a1a1a] font-bold mt-[20px]" style={{ fontSize: ms(15) }}>Additional Picture for reference *</Text>
          <Text className="text-[#888] mb-[12px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>To help us gain a clearer understanding of your condition.</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-center border-[1.5px] border-dashed border-purple-500 rounded-[18px] bg-purple-500/5 overflow-hidden" 
            style={{ paddingVertical: vs(14), minHeight: vs(60) }}
            onPress={() => pickImage('ref')}
          >
            {refImage ? (
              <Image source={{ uri: refImage }} className="w-full" style={{ height: vs(160) }} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="image-outline" size={24} color="#9B59B6" />
                <Text className="text-purple-500 font-extrabold ml-[8px]" style={{ fontSize: ms(14) }}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hair Information Section ────────────────── */}
        <Animated.View 
          entering={FadeInDown.delay(300)} 
          className="bg-white rounded-[24px]"
          style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
        >
          <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Hair Information</Text>
          
          <Text className="text-[#444] font-black mb-[12px]" style={{ fontSize: ms(14) }}>Hair Length *</Text>
          <View className="flex-row gap-[10px]">
            {['Long', 'Short'].map((val: any) => (
              <TouchableOpacity
                key={val}
                className={`flex-1 py-[12px] items-center rounded-[16px] border-[1.5px] ${hairLength === val ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-white'}`}
                onPress={() => setHairLength(val)}
              >
                <Text className={`font-bold ${hairLength === val ? 'text-purple-500' : 'text-[#666]'}`} style={{ fontSize: ms(14) }}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-[#444] font-black mb-[12px] mt-[20px]" style={{ fontSize: ms(14) }}>Wig Color *</Text>
          <View className="flex-row gap-[10px]">
            {['Black', 'Brown', 'Light'].map((val: any) => (
              <TouchableOpacity
                key={val}
                className={`flex-1 py-[12px] items-center rounded-[16px] border-[1.5px] ${wigColor === val ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-white'}`}
                onPress={() => setWigColor(val)}
              >
                <Text className={`font-bold ${wigColor === val ? 'text-purple-500' : 'text-[#666]'}`} style={{ fontSize: ms(14) }}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Quick Survey Section ────────────────────── */}
        <Animated.View 
          entering={FadeInDown.delay(400)} 
          className="bg-white rounded-[24px]"
          style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
        >
          <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Quick Survey</Text>
          <Text className="text-[#444] font-black mb-[12px]" style={{ fontSize: ms(14) }}>Where did you hear about us? *</Text>
          {[
            'Facebook Page',
            'Instagram Page',
            'Other Social Media (X, TikTok, etc.)',
            'Family and / or Friends',
            'Online Article or News',
            'Other',
          ].map(item => (
            <CustomCheckbox
              key={item}
              label={item}
              checked={surveySource.includes(item)}
              onPress={() => toggleSurvey(item)}
            />
          ))}

          <Text className="text-[#444] font-black mb-[12px] mt-[24px]" style={{ fontSize: ms(14) }}>Usage Consent *</Text>
          <Text className="text-[#888] mb-[12px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>Willing to share with other supporters?</Text>
          {[
            'Personal Details in My story',
            'My Diagnosis',
            'My Photograph',
            'None of the above',
          ].map(item => (
            <CustomCheckbox
              key={item}
              label={item}
              checked={permissions.includes(item)}
              onPress={() => togglePermission(item)}
            />
          ))}
          <Text className="text-[#aaa] mt-[10px] italic" style={{ fontSize: ms(11) }}>
            Items checked may be used for promotional materials as testimonies.
          </Text>
        </Animated.View>

        {/* ── Submit Button ───────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(500)} className="mt-[10px]">
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
            <LinearGradient
              colors={['#8E44AD', '#9B59B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center rounded-full"
              style={[{ height: vs(60), opacity: loading ? 0.7 : 1 }, shadows.submit]}
            >
              <Text className="text-white font-black mr-[10px]" style={{ fontSize: ms(18) }}>{loading ? 'Uploading...' : 'Submit Request'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      <RequestSuccessModal 
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onSuccess();
        }}
      />
    </KeyboardAvoidingView>
  );
}


