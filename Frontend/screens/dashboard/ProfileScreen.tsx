import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Dimensions,
    KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Animated, {
    FadeInDown,
    FadeInUp,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import api from '../../lib/api';

const shadows = {
    glassButton: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    premiumCamBtn: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    roleCard: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        shadowOffset: { width: 0, height: 4 }
    },
    toggleThumb: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5
    },
    miniEditBtn: {
        elevation: 2,
    },
    glassCard: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
        shadowOffset: { width: 0, height: 4 }
    },
    premiumCard: {
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 }
    },
};

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
    onBack: () => void;
    onLogout: () => void;
    onRoleChange?: (role: 'Donor' | 'Recipient') => void;
}

export default function ProfileScreen({ onBack, onLogout, onRoleChange }: ProfileScreenProps) {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Profile Data
    const [profile, setProfile] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'Donor' | 'Recipient'>('Donor');
    const [points, setPoints] = useState(0);
    const [referralCode, setReferralCode] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [hasRedeemed, setHasRedeemed] = useState(false);

    // Redemption State
    const [otherReferralCode, setOtherReferralCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Animation values
    const roleToggleValue = useSharedValue(role === 'Donor' ? 0 : 1);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/me');
            const data = response.data;

            if (data) {
                setProfile(data);
                setEmail(data.email || '');
                setFullName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || '');
                setPhone(data.phone || '');
                const fetchedRole = data.role ? (data.role.charAt(0).toUpperCase() + data.role.slice(1).toLowerCase()) : 'Donor';
                setRole(fetchedRole as 'Donor' | 'Recipient');
                setPoints(data.star_points || 0);
                setReferralCode(data.referral_code || '---');
                setAvatarUrl(data.profile_photo_url); // This uses the accessor we checked earlier
                setHasRedeemed(data.has_redeemed_code || false);
                roleToggleValue.value = withSpring(fetchedRole === 'Donor' ? 0 : 1);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to fetch profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        // Referral redemption logic on Laravel backend still pending implementation
        Alert.alert('Coming Soon', 'Referral code redemption will be available in the next update!');
    };

    const handleUpdateProfile = async () => {
        try {
            setUpdating(true);
            
            // Split full name back into first and last for Laravel
            const names = fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ');

            const response = await api.post('/profile/update', {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                role: role,
                email: email
            });

            Alert.alert('Success', 'Profile updated successfully! ✨');
            setEditMode(false);
            fetchProfile(); // Sync state
        } catch (error: any) {
            Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // Reduced quality for faster upload
            });

            if (!result.canceled) {
                uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            setUpdating(true);

            const formData = new FormData();
            const fileExt = uri.split('.').pop()?.toLowerCase();
            const fileName = `avatar.${fileExt}`;

            formData.append('avatar', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: fileName,
                type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            } as any);

            const response = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setAvatarUrl(response.data.avatar_url);
            Alert.alert('Success', 'Profile picture updated! ✨');
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Error', 'Failed to upload image to server.');
        } finally {
            setUpdating(false);
        }
    };

    const copyReferral = async () => {
        await Clipboard.setStringAsync(referralCode);
        Alert.alert('Copied', 'Referral code copied to clipboard!');
    };

    const toggleRole = () => {
        const newRole = role === 'Donor' ? 'Recipient' : 'Donor';

        Alert.alert(
            'Switch Role?',
            `Are you sure you want to switch to the ${newRole} dashboard?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Switch Now',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            await api.post('/profile/update', { role: newRole });
                            
                            setRole(newRole);
                            roleToggleValue.value = withSpring(newRole === 'Donor' ? 0 : 1);

                            if (onRoleChange) {
                                setTimeout(() => onRoleChange(newRole), 500);
                            }
                        } catch (err: any) {
                            Alert.alert('Switch Failed', 'Failed to update role on server.');
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    const animatedToggleStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                roleToggleValue.value,
                [0, 1],
                ['#FF1493', '#9B59B6']
            ),
        };
    });

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#FF1493" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            className="flex-1 bg-[#fdfdfd]"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? ms(0) : ms(20)}
        >
            <StatusBar style="light" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header Hero Section */}
                <LinearGradient
                    colors={role === 'Donor' ? ['#FF1493', '#FF69B4'] : ['#8E44AD', '#9B59B6']}
                    className="rounded-b-[45px]"
                    style={{ paddingBottom: vs(50), paddingTop: insets.top }}
                >
                    <View className="flex-row items-center justify-between px-[20px] pt-[10px]">
                        <TouchableOpacity 
                            onPress={onBack} 
                            className="bg-white/20 items-center justify-center border border-white/30"
                            style={[{ width: ms(44), height: ms(44), borderRadius: ms(22) }, shadows.glassButton]}
                        >
                            <Ionicons name="chevron-back" size={ms(24)} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-white font-black uppercase tracking-[0.5px]" style={{ fontSize: ms(20) }}>Account Settings</Text>
                        <View style={{ width: ms(44) }} />
                    </View>

                    {/* Premium Avatar Section */}
                    <Animated.View entering={FadeInDown.springify()} className="items-center mt-[25px]">
                            <View className="relative">
                                <View 
                                    className="bg-white border-[5px] border-white overflow-hidden"
                                    style={{ width: ms(140), height: ms(140), borderRadius: ms(70) }}
                                >
                                    <Image
                                        source={avatarUrl ? { uri: avatarUrl } : require('../../assets/logo.png')}
                                        className="w-full h-full"
                                    />
                                </View>
                                <TouchableOpacity
                                    className="absolute bottom-[4px] right-[4px] bg-[#1a1a1a] items-center justify-center border-[3px] border-white z-10"
                                    style={[{ width: ms(44), height: ms(44), borderRadius: ms(22) }, shadows.premiumCamBtn]}
                                    onPress={pickImage}
                                    disabled={updating}
                                    activeOpacity={0.7}
                                >
                                    {updating ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="camera" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <Text className="text-white font-black mt-[18px] tracking-[-0.5px]" style={{ fontSize: ms(26) }}>{fullName || 'User Name'}</Text>
                            <View className="bg-white/15 px-[16px] py-[6px] rounded-[15px] mt-[10px]">
                                <Text className="text-white font-extrabold tracking-[1.5px]" style={{ fontSize: ms(13) }}>#{String(profile?.id || '0').padStart(4, '0')}</Text>
                            </View>
                        </Animated.View>
                </LinearGradient>

                <View className="mt-[-40px] px-[20px]">
                    {/* Role Switcher Premium */}
                    <Animated.View 
                        entering={FadeInUp.delay(200)} 
                        className="bg-white p-[24px] rounded-[30px] mb-[25px]"
                        style={shadows.roleCard}
                    >
                        <Text className="font-black text-[#ccc] tracking-[2px] mb-[18px] uppercase" style={{ fontSize: ms(12) }}>COMMUNITY STATUS</Text>
                        <View style={{ height: vs(60) }}>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={toggleRole}
                                className="flex-1 bg-[#f0f0f0] rounded-[30px] relative overflow-hidden"
                            >
                                <Animated.View 
                                    className="absolute top-[5px] bottom-[5px] items-center justify-center z-10"
                                    style={[
                                        animatedToggleStyle, 
                                        { left: role === 'Donor' ? 4 : '50%', width: '48%', borderRadius: ms(25) }, 
                                        shadows.toggleThumb
                                    ]}
                                >
                                    <Text className="text-white font-black uppercase" style={{ fontSize: ms(15) }}>{role}</Text>
                                </Animated.View>
                                <View className="flex-1 flex-row items-center justify-around px-[10px]">
                                    <Text className={`text-[#aaa] font-extrabold uppercase ${role === 'Donor' ? 'opacity-0' : ''}`} style={{ fontSize: ms(14) }}>Donor</Text>
                                    <Text className={`text-[#aaa] font-extrabold uppercase ${role === 'Recipient' ? 'opacity-0' : ''}`} style={{ fontSize: ms(14) }}>Recipient</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Edit Section */}
                    <View className="mb-[30px]">
                        <View className="flex-row items-center justify-between mb-[18px]">
                            <Text className="font-black text-[#ccc] tracking-[2px] uppercase" style={{ fontSize: ms(12) }}>PERSONAL DETAILS</Text>
                            <TouchableOpacity
                                className={`flex-row items-center px-[18px] py-[10px] rounded-[15px] ${editMode ? 'bg-[#27AE60]' : 'bg-[#bbb]'}`}
                                style={shadows.miniEditBtn}
                                onPress={() => editMode ? handleUpdateProfile() : setEditMode(true)}
                                disabled={updating}
                            >
                                <Feather name={editMode ? "check" : "edit-3"} size={ms(14)} color="#fff" />
                                <Text className="text-white font-black ml-[8px] uppercase" style={{ fontSize: ms(13) }}>{editMode ? 'Save' : 'Edit'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="bg-white rounded-[30px]" style={shadows.glassCard}>
                            <InfoRow
                                icon="mail"
                                label="Email Address"
                                value={email}
                                isEdit={editMode}
                                onChange={setEmail}
                                keyboardType="email-address"
                                themeColor={role === 'Donor' ? '#FF1493' : '#9B59B6'}
                            />
                            <View className="h-[1px] bg-[#f5f5f5] ml-[80px]" />
                            <InfoRow
                                icon="user"
                                label="Full Name"
                                value={fullName}
                                isEdit={editMode}
                                onChange={setFullName}
                                themeColor={role === 'Donor' ? '#FF1493' : '#9B59B6'}
                            />
                            <View className="h-[1px] bg-[#f5f5f5] ml-[80px]" />
                            <InfoRow
                                icon="phone"
                                label="Mobile Number"
                                value={phone}
                                isEdit={editMode}
                                onChange={setPhone}
                                keyboardType="phone-pad"
                                themeColor={role === 'Donor' ? '#FF1493' : '#9B59B6'}
                            />
                        </View>
                    </View>

                    {/* Rewards Premium View - Only for Donors */}
                    {role === 'Donor' && (
                        <Animated.View 
                            entering={FadeInUp.delay(300)} 
                            className="rounded-[32px] overflow-hidden mb-[25px] bg-[#1a1a1a]"
                            style={shadows.premiumCard}
                        >
                            <LinearGradient
                                colors={['#1a1a1a', '#2d2d2d']}
                                className="p-[26px]"
                                style={{ minHeight: vs(220) }}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View className="flex-row items-center justify-between mb-[20px]">
                                    <View className="flex-row items-center bg-white/10 px-[14px] py-[8px] rounded-[14px]">
                                        <FontAwesome5 name="medal" size={ms(14)} color="#FFD700" />
                                        <Text className="text-[#FFD700] font-black ml-[8px] tracking-[1.5px]" style={{ fontSize: ms(10) }}>ELITE MEMBER</Text>
                                    </View>
                                    <Ionicons name="star" size={ms(24)} color="#FFD700" opacity={0.8} />
                                </View>

                                <View className="items-center justify-center py-[20px]">
                                    <Text className="text-white font-black tracking-[-2px]" style={{ fontSize: ms(66) }}>{points}</Text>
                                    <Text className="text-white/40 font-black tracking-[3px] uppercase mt-[4px]" style={{ fontSize: ms(11) }}>TOTAL REWARD STARS</Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Logout Action */}
                    <TouchableOpacity 
                        className="flex-row items-center justify-center bg-[#FFF5F5] border-2 border-[#FEE2E2] p-[20px] rounded-[24px] mb-[20px]" 
                        onPress={onLogout}
                    >
                        <Feather name="log-out" size={ms(18)} color="#C0392B" />
                        <Text className="text-[#C0392B] font-black ml-[12px] uppercase tracking-[1px]" style={{ fontSize: ms(16) }}>Sign Out Account</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function InfoRow({ icon, label, value, isEdit, onChange, keyboardType, themeColor }: any) {
    return (
        <View className="flex-row items-center p-[22px]">
            <View 
                className="items-center justify-center border border-[#f0f0f0] bg-[#f9f9f9] mr-[18px]"
                style={{ width: ms(44), height: ms(44), borderRadius: ms(14) }}
            >
                <Feather name={icon} size={ms(18)} color={themeColor} />
            </View>
            <View className="flex-1">
                <Text className="font-extrabold text-[#ccc] mb-[4px] uppercase tracking-[0.5px]" style={{ fontSize: ms(12) }}>{label}</Text>
                {isEdit ? (
                    <TextInput
                        className="font-black p-0"
                        style={{ fontSize: ms(16), color: themeColor }}
                        value={value}
                        onChangeText={onChange}
                        placeholder={`Enter ${label}`}
                        keyboardType={keyboardType}
                        autoCapitalize={label === 'Email Address' ? 'none' : 'words'}
                    />
                ) : (
                    <Text className="text-[#1a1a1a] font-black" style={{ fontSize: ms(14) }}>{value || `Add ${label}`}</Text>
                )}
            </View>
        </View>
    );
}



