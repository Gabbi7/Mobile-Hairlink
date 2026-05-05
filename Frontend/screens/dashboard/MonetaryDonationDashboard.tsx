import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import DonationSuccessModal from '../../components/DonationSuccessModal';

interface MonetaryDonationDashboardProps {
    onBack: () => void;
    onSuccess?: () => void;
    role?: 'Donor' | 'Recipient';
}

export default function MonetaryDonationDashboard({ onBack, onSuccess, role = 'Donor' }: MonetaryDonationDashboardProps) {
    const isRecipient = role === 'Recipient';
    
    // Theme Colors
    const themeColor = isRecipient ? '#9B59B6' : '#FF1493';
    const themeMedium = isRecipient ? '#8E44AD' : '#FF66B2';
    const themeLight = isRecipient ? '#E8DAEF' : '#FFB3D9';
    const themeFrame = isRecipient ? '#F5EEF8' : '#F5DEE7';
    const themeBg = isRecipient ? '#F9F4FC' : '#F9F5F7';

    const [amount, setAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'InstaPay'>('Bank');
    const [fullName, setFullName] = useState('');
    const [numAmount, setNumAmount] = useState('');
    const [wordsAmount, setWordsAmount] = useState('');
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [anonymous, setAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [showSuccess, setShowSuccess] = useState(false);
    const [lastAmount, setLastAmount] = useState(0);
    const [earnedStars, setEarnedStars] = useState(0);

    const amounts = [50, 100, 150, 200, 250];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProofImage(result.assets[0].uri);
        }
    };

    const handleDonate = async () => {
        setSubmitError(null);
        if (!fullName || !numAmount || !proofImage) {
            setSubmitError('Please provide your name, amount, and upload a proof of payment.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('reference', `MON-${Date.now()}`);
            formData.append('type', 'monetary');
            formData.append('full_name', fullName);
            formData.append('amount', numAmount);
            formData.append('words_amount', wordsAmount);
            formData.append('anonymous', anonymous ? '1' : '0');

            const filename = proofImage.split('/').pop() || 'proof.jpg';
            const match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;
            if (type === 'image/jpg') type = 'image/jpeg';

            formData.append('proof_photo', {
                uri: Platform.OS === 'ios' ? proofImage.replace('file://', '') : proofImage,
                name: filename,
                type: type,
            } as any);

            const response = await api.post('/donations', formData);

            if (response.status === 201 || response.status === 200) {
                const donationAmount = parseFloat(numAmount);
                setLastAmount(donationAmount);
                setEarnedStars(Math.floor(donationAmount / 100));
                setShowSuccess(true);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to submit donation.';
            setSubmitError(errorMsg);
            Alert.alert('Donation Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView 
            className="flex-1"
            style={{ backgroundColor: themeBg, paddingTop: insets.top }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="dark" />
            
            <View className="flex-row items-center justify-between px-[16px] py-[14px]">
                <TouchableOpacity onPress={onBack} className="w-[40px] h-[40px] items-center justify-center rounded-full bg-black/5">
                    <Ionicons name="arrow-back" size={ms(26)} color="#1a1a1a" />
                </TouchableOpacity>
                <Image source={require('../../assets/logo.png')} className="bg-white" style={{ width: ms(44), height: ms(44), borderRadius: ms(22) }} resizeMode="contain" />
                <View className="w-[40px]" />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: ms(20), paddingBottom: vs(40) }} showsVerticalScrollIndicator={false}>
                <Text className="text-[28px] font-black text-[#1a1a1a] text-center mt-[10px]">Monetary Donation</Text>
                
                <View className="border-[1.5px] rounded-[20px] p-[18px] mt-[24px] mb-[24px]" style={{ borderColor: themeMedium }}>
                    <View className="flex-row items-center">
                        <Ionicons name="information-circle-outline" size={ms(22)} color={themeColor} />
                        <Text style={{ color: themeColor }} className="text-[16px] font-extrabold"> Donation Guidelines</Text>
                    </View>
                    <View className="flex-row mt-[10px]">
                        <View className="flex-1 pr-[10px]">
                            <Text className="text-[13px] font-extrabold text-[#555] mt-[6px]">• Prepare the following:</Text>
                            <Text className="text-[12px] text-[#666]">   - Proof of transfer</Text>
                            <Text className="text-[12px] text-[#666]">   - Account details</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[13px] font-extrabold text-[#555] mt-[6px]">• Wait for our message</Text>
                            <Text className="text-[13px] font-extrabold text-[#555] mt-[6px]">• Fill up the form</Text>
                        </View>
                    </View>
                </View>

                <View className="border-[1.5px] rounded-[30px] p-[20px] mb-[20px]" style={{ borderColor: themeLight }}>
                    <Text className="text-[20px] font-black text-[#1a1a1a] mb-[16px]">Donation details</Text>

                    <Text className="text-[14px] font-extrabold text-[#444] mb-[8px]">Select an amount</Text>
                    <View className="flex-row flex-wrap gap-[10px] mb-[16px]">
                        {amounts.map((v) => (
                            <TouchableOpacity
                                key={v}
                                className={`border-[1.5px] rounded-[12px] p-[12px] flex-[0.47] items-center ${amount === v ? 'bg-transparent' : ''}`}
                                style={{ borderColor: amount === v ? themeMedium : themeLight, backgroundColor: amount === v ? themeMedium : 'transparent' }}
                                onPress={() => { setAmount(v); setCustomAmount(''); setNumAmount(v.toString()); }}
                            >
                                <Text className={`text-[18px] font-extrabold ${amount === v ? 'text-white' : 'text-[#888]'}`}>₱ {v}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text className="text-[14px] font-extrabold text-[#444] mb-[8px]">Or Enter A Custom Amount</Text>
                    <View className="border-[1.5px] rounded-[12px] h-[52px] px-[16px] justify-center mb-[20px]" style={{ borderColor: themeLight }}>
                        <TextInput className="text-[16px] text-[#1a1a1a]" placeholder="Enter custom amount" placeholderTextColor="#999" keyboardType="number-pad" value={customAmount} onChangeText={(t) => { setCustomAmount(t); setAmount(null); setNumAmount(t); }} />
                    </View>

                    <View className="flex-row self-end mb-[24px] mt-[10px]">
                        <TouchableOpacity className={`border-[1px] p-[10px] px-[16px] min-w-[110px] items-center ${paymentMethod === 'Bank' ? '' : 'border-[#555]'}`} style={{ backgroundColor: paymentMethod === 'Bank' ? themeMedium : 'transparent', borderColor: paymentMethod === 'Bank' ? themeMedium : '#555', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} onPress={() => setPaymentMethod('Bank')}>
                            <Text className={`text-[14px] font-bold ${paymentMethod === 'Bank' ? 'text-white' : 'text-[#1a1a1a]'}`}>Bank Transfer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className={`border-[1px] p-[10px] px-[16px] min-w-[110px] items-center ${paymentMethod === 'InstaPay' ? '' : 'border-[#555]'} border-l-0`} style={{ backgroundColor: paymentMethod === 'InstaPay' ? themeMedium : 'transparent', borderColor: paymentMethod === 'InstaPay' ? themeMedium : '#555', borderTopRightRadius: 16, borderBottomRightRadius: 16 }} onPress={() => setPaymentMethod('InstaPay')}>
                            <Text className={`text-[14px] font-bold ${paymentMethod === 'InstaPay' ? 'text-white' : 'text-[#1a1a1a]'}`}>InstaPay</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-[20px] font-black text-[#1a1a1a] mb-[16px]">Billing Information</Text>
                    <View className="rounded-[20px] p-[24px] py-[36px] mb-[24px] items-center" style={{ backgroundColor: themeFrame }}>
                        {paymentMethod === 'Bank' ? (
                            <View className="items-center">
                                <View className="w-[120px] h-[120px] bg-[#005b9f] justify-center items-center mb-[16px]">
                                    <Text className="text-[#f7c800] text-[40px] font-black italic">BDO</Text>
                                </View>
                                <Text className="text-[18px] font-black text-[#1a1a1a]">Venus Alinsod</Text>
                                <Text className="text-[16px] font-black text-[#1a1a1a]">004560025684</Text>
                            </View>
                        ) : (
                            <View className="items-center">
                                <View className="w-[140px] h-[140px] bg-white justify-center items-center mb-[16px] border-[4px] border-[#1a1a1a]">
                                    <Ionicons name="qr-code-outline" size={ms(100)} color="#1a1a1a" />
                                </View>
                                <Text className="text-[18px] font-black text-[#1a1a1a]">InstaPay QR</Text>
                                <Text className="text-[16px] font-black text-[#1a1a1a]">Scan to donate</Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-[14px] font-extrabold text-[#444] mt-[4px]">Full Name *</Text>
                    <View className="border-[1.5px] rounded-[12px] h-[52px] px-[16px] justify-center mb-[20px]" style={{ borderColor: themeLight }}>
                        <TextInput className="text-[16px]" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
                    </View>

                    <Text className="text-[14px] font-extrabold text-[#444] mt-[4px]">Amount of Donation (in number) *</Text>
                    <View className="border-[1.5px] rounded-[12px] h-[52px] px-[16px] justify-center mb-[20px]" style={{ borderColor: themeLight }}>
                        <TextInput className="text-[16px]" placeholder="Ex. 10,000.00" keyboardType="numeric" value={numAmount} onChangeText={setNumAmount} />
                    </View>

                    <Text className="text-[14px] font-extrabold text-[#444] mt-[4px]">Amount of Donation (in words) *</Text>
                    <View className="border-[1.5px] rounded-[12px] h-[52px] px-[16px] justify-center mb-[20px]" style={{ borderColor: themeLight }}>
                        <TextInput className="text-[16px]" placeholder="Ex. Ten thousand pesos" value={wordsAmount} onChangeText={setWordsAmount} />
                    </View>

                    <Text className="text-[14px] font-extrabold text-[#444] mt-[4px]">Proof of Donation *</Text>
                    <Text className="text-[11px] text-[#888] mb-[8px]">Kindly insert the screenshot/photo or any proof of donation</Text>

                    {proofImage ? (
                        <View className="mb-[24px] self-start">
                            <Image source={{ uri: proofImage }} className="w-[100px] h-[140px] rounded-[12px] border-[1.5px]" style={{ borderColor: themeLight }} />
                            <TouchableOpacity className="absolute -top-[10px] -right-[10px] bg-white rounded-full" onPress={() => setProofImage(null)}>
                                <Ionicons name="close-circle" size={28} color="#e53e3e" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity className="flex-row items-center self-start border-[1.5px] border-[#1a1a1a] rounded-[12px] p-[12px] mb-[24px]" onPress={pickImage}>
                            <Ionicons name="cloud-upload-outline" size={20} color="#1a1a1a" />
                            <Text className="font-bold ml-[8px]">Add File</Text>
                        </TouchableOpacity>
                    )}

                    <View className="flex-row items-center mb-[30px]">
                        <Switch trackColor={{ false: '#d1d1d1', true: themeLight }} thumbColor={anonymous ? themeMedium : '#f4f3f4'} onValueChange={setAnonymous} value={anonymous} />
                        <Text className="text-[14px] font-extrabold text-[#444] ml-[10px]">Make this donation anonymous</Text>
                    </View>

                    <TouchableOpacity
                        className="rounded-[24px] h-[56px] justify-center items-center shadow-lg"
                        style={{ backgroundColor: themeMedium, shadowColor: themeColor, opacity: loading ? 0.7 : 1 }}
                        onPress={handleDonate}
                        disabled={loading}
                    >
                        <Text className="text-white text-[20px] font-black">{loading ? 'Submitting...' : 'Donate it'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <DonationSuccessModal
                visible={showSuccess}
                amount={lastAmount}
                stars={earnedStars}
                role={role}
                onClose={() => {
                    setShowSuccess(false);
                    if (onSuccess) onSuccess();
                    else onBack();
                }}
            />
        </KeyboardAvoidingView>
    );
}

