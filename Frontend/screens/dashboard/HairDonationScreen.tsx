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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import DonationSuccessModal from '../../components/DonationSuccessModal';
import api from '../../lib/api';

const shadows = {
    header: {
        shadowColor: '#FF1493',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    card: {
        shadowColor: '#FF1493',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    submit: {
        shadowColor: '#FF1493',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
};

interface HairDonationScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

export default function HairDonationScreen({ onBack, onSuccess }: HairDonationScreenProps) {
    const [hairLength, setHairLength] = useState<'Short' | 'Long' | null>(null);
    const [hairColor, setHairColor] = useState<'Black' | 'Brown' | 'Light' | null>(null);
    const [chemicallyTreated, setChemicallyTreated] = useState(false);
    const [address, setAddress] = useState('');
    const [reason, setReason] = useState('');
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState('Submitting...');
    const [showSuccess, setShowSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleImageSource = () => {
        Alert.alert(
            'Upload Photo',
            'Select the source of your hair photo',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Gallery', onPress: pickImageFromLibrary },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera access to take a photo of your donation.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProofImage(result.assets[0].uri);
        }
    };

    const pickImageFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to pick a photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setProofImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        if (!hairLength || !hairColor || !address || !reason || !proofImage) {
            setSubmitError('Please fill in all fields and upload a photo.');
            return;
        }

        setLoading(true);
        setLoadingLabel('Preparing submission...');
        
        try {
            const formData = new FormData();
            formData.append('reference', `MOB-${Date.now()}`);
            formData.append('type', 'hair');
            formData.append('hair_length', hairLength);
            formData.append('hair_color', hairColor);
            formData.append('treated_hair', chemicallyTreated ? '1' : '0');
            formData.append('address', address);
            formData.append('reason', reason);

            const filename = proofImage.split('/').pop() || 'donation.jpg';
            const match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;
            if (type === 'image/jpg') type = 'image/jpeg';

            formData.append('photo_front', {
                uri: Platform.OS === 'ios' ? proofImage.replace('file://', '') : proofImage,
                name: filename,
                type: type,
            } as any);

            setLoadingLabel('Uploading to secure server...');
            
            const response = await api.post('/donations', formData);

            if (response.status === 201 || response.status === 200) {
                setShowSuccess(true);
            } else {
                throw new Error('Unexpected server response.');
            }
        } catch (err: any) {
            console.error('Submission error:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
            setSubmitError(errorMsg);
            Alert.alert('Submission Error', errorMsg);
        } finally {
            setLoading(false);
            setLoadingLabel('Submitting...');
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView 
            className="flex-1 bg-[#FFF9FB]"
            style={{ paddingTop: insets.top }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="light" />

            {/* ── Elite Header ──────────────────────────────── */}
            <LinearGradient
                colors={['#FF66B2', '#FF1493']}
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
                    <Text className="text-white font-black" style={{ fontSize: ms(22) }}>Hair Donation</Text>
                </View>
                <View style={{ width: ms(44) }} />
            </LinearGradient>

            {loading && (
                <View className="absolute inset-0 bg-black/60 z-[999] items-center justify-center">
                    <ActivityIndicator size="large" color="#fff" />
                    <Text className="text-white mt-[15px] font-extrabold" style={{ fontSize: ms(16) }}>{loadingLabel}</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={{ paddingHorizontal: ms(16), paddingBottom: vs(50), paddingTop: vs(10) }} showsVerticalScrollIndicator={false}>

                {/* ── Section 1: Your Donation Story ────────── */}
                <Animated.View 
                    entering={FadeInDown.delay(100)} 
                    className="bg-white rounded-[24px] border border-pink-100"
                    style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
                >
                    <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Donation Story</Text>
                    <Text className="text-[#444] font-bold mb-[10px]" style={{ fontSize: ms(15) }}>Kindly describe the reason for your hair donation. *</Text>
                    <View className="mb-[15px]">
                        {[
                            'Who are you donating for?',
                            'What inspired your gift?',
                            'A message for the future recipient',
                        ].map((item, i) => (
                            <View key={i} className="flex-row items-center mb-[6px]">
                                <Ionicons name="heart" size={14} color="#FF66B2" />
                                <Text className="text-[#666] font-medium ml-[8px]" style={{ fontSize: ms(13) }}>{item}</Text>
                            </View>
                        ))}
                    </View>
                    <TextInput
                        className="bg-pink-50/30 border-[1.5px] border-pink-200 rounded-[18px] text-[#1a1a1a] font-medium"
                        style={{ padding: ms(16), height: vs(140), fontSize: ms(15) }}
                        placeholder="Tell us your story..."
                        placeholderTextColor="#999"
                        multiline
                        value={reason}
                        onChangeText={setReason}
                        textAlignVertical="top"
                    />
                </Animated.View>

                {/* ── Section 2: Hair Information ───────────── */}
                <Animated.View 
                    entering={FadeInDown.delay(200)} 
                    className="bg-white rounded-[24px] border border-pink-100"
                    style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
                >
                    <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Hair Specifications</Text>

                    <Text className="text-[#444] font-black mb-[12px]" style={{ fontSize: ms(14) }}>Hair Length *</Text>
                    <View className="flex-row gap-[10px]">
                        {['Short', 'Long'].map((val: any) => (
                            <TouchableOpacity
                                key={val}
                                className={`flex-1 py-[12px] items-center rounded-[16px] border-[1.5px] ${hairLength === val ? 'border-primary bg-pink-50' : 'border-pink-200 bg-white'}`}
                                onPress={() => setHairLength(val)}
                            >
                                <Text className={`font-bold ${hairLength === val ? 'text-primary' : 'text-[#666]'}`} style={{ fontSize: ms(14) }}>
                                    {val === 'Short' ? 'Short' : 'Long '}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text className="text-[#444] font-black mb-[12px] mt-[20px]" style={{ fontSize: ms(14) }}>Natural Hair Color *</Text>
                    <View className="flex-row gap-[10px]">
                        {['Black', 'Brown', 'Light'].map((val: any) => (
                            <TouchableOpacity
                                key={val}
                                className={`flex-1 py-[12px] items-center rounded-[16px] border-[1.5px] ${hairColor === val ? 'border-primary bg-pink-50' : 'border-pink-200 bg-white'}`}
                                onPress={() => setHairColor(val)}
                            >
                                <Text className={`font-bold ${hairColor === val ? 'text-primary' : 'text-[#666]'}`} style={{ fontSize: ms(14) }}>{val}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        className="flex-row items-center mt-[24px]"
                        onPress={() => setChemicallyTreated(!chemicallyTreated)}
                        activeOpacity={0.8}
                    >
                        <View 
                            className={`w-[24px] h-[24px] rounded-[8px] border-2 items-center justify-center mr-[12px] ${chemicallyTreated ? 'bg-primary border-primary' : 'border-pink-200'}`}
                        >
                            {chemicallyTreated && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text className="flex-1 text-[#555] font-semibold" style={{ fontSize: ms(14), lineHeight: vs(20) }}>
                            My hair has been chemically treated (colored, permed, etc.)
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Section 3: Proof & Verification ────────── */}
                <Animated.View 
                    entering={FadeInDown.delay(300)} 
                    className="bg-white rounded-[24px] border border-pink-100"
                    style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
                >
                    <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Proof of Hair</Text>
                    <Text className="text-[#444] font-bold mb-[10px]" style={{ fontSize: ms(15) }}>Upload a clear picture of the hair. *</Text>
                    <Text className="text-[#888] mb-[12px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>Ensure the hair is visible and measured if possible. MAX 10MB.</Text>

                    <TouchableOpacity 
                        className="flex-row items-center justify-center border-[1.5px] border-dashed border-secondary rounded-[18px] bg-pink-400/5 overflow-hidden" 
                        style={{ paddingVertical: vs(20) }}
                        onPress={handleImageSource}
                    >
                        {proofImage ? (
                            <Image source={{ uri: proofImage }} className="w-full" style={{ height: vs(200) }} resizeMode="cover" />
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={32} color="#FF66B2" />
                                <Text className="text-secondary font-black ml-[8px]" style={{ fontSize: ms(15) }}>Add Photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Section 4: Shipping Logistics ───────────── */}
                <Animated.View 
                    entering={FadeInDown.delay(400)} 
                    className="bg-white rounded-[24px] border border-pink-100"
                    style={[{ padding: ms(20), marginBottom: vs(20) }, shadows.card]}
                >
                    <Text className="text-[#1a1a1a] font-black mb-[12px]" style={{ fontSize: ms(20) }}>Shipping Logistics</Text>
                    <Text className="text-[#444] font-bold mb-[10px]" style={{ fontSize: ms(15) }}>Where will you be sending from? *</Text>
                    <TextInput
                        className="bg-pink-50/30 border-[1.5px] border-pink-200 rounded-[18px] text-[#1a1a1a] font-medium"
                        style={{ padding: ms(16), height: vs(100), fontSize: ms(15) }}
                        placeholder="Enter your complete shipping address..."
                        placeholderTextColor="#999"
                        multiline
                        value={address}
                        onChangeText={setAddress}
                        textAlignVertical="top"
                    />
                </Animated.View>

                {/* ── Submit Button ───────────────────────────── */}
                <Animated.View entering={FadeInUp.delay(500)} className="mt-[10px]">
                    {submitError && (
                        <View className="p-[12px] bg-red-50 rounded-[16px] mb-[16px] border border-red-200">
                            <Text className="text-red-600 font-bold text-center" style={{ fontSize: ms(13) }}>{submitError}</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
                        <LinearGradient
                            colors={['#FF66B2', '#FF1493']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="flex-row items-center justify-center rounded-full"
                            style={[{ height: vs(60) }, shadows.submit]}
                        >
                            <Text className="text-white font-black" style={{ fontSize: ms(18) }}>{loading ? 'Submitting...' : 'Submit Donation'}</Text>
                            {!loading && <Ionicons name="heart" size={20} color="#fff" className="ml-[8px]" />}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>

            <DonationSuccessModal
                visible={showSuccess}
                type="hair"
                amount={0}
                stars={10}
                onClose={() => {
                    setShowSuccess(false);
                    if (onSuccess) onSuccess();
                    else onBack();
                }}
            />
        </KeyboardAvoidingView>
    );
}


