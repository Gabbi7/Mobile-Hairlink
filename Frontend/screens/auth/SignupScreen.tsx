import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Platform,
    ScrollView,
    Image,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import AuthStatusModal from "../../components/AuthStatusModal";
import Animated, { 
    FadeInDown, 
    FadeInUp, 
    FadeInRight, 
    Layout, 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring 
} from "react-native-reanimated";

// Reusable animated button for tactile feedback
const ScaleButton = ({ children, onPress, style, className }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]} className={className}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.96, { damping: 10, stiffness: 200 }))}
                onPressOut={() => (scale.value = withSpring(1))}
                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];

interface SignupScreenProps {
    onSignupComplete: (role: "Donor" | "Recipient") => void;
    onNeedsVerification: (email: string, role: "Donor" | "Recipient") => void;
    onSwitchToLogin: () => void;
}

export default function SignupScreen({
    onSignupComplete,
    onNeedsVerification,
    onSwitchToLogin,
}: SignupScreenProps) {
    const insets = useSafeAreaInsets();
    // ── Form state ──────────────────────────────────────────────
    const [role, setRole] = useState<"Donor" | "Recipient" | null>(null);
    const [ageText, setAgeText] = useState("18"); // fallback for text input instead of slider
    const [gender, setGender] = useState("Female");
    const [pickingGender, setPickingGender] = useState(false);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [barangay, setBarangay] = useState("");
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ── View mode ────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<"form" | "otp">("form");

    // ── Email validation ─────────────────────────────────────────
    const [emailTouched, setEmailTouched] = useState(false);
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const emailError = emailTouched && !isEmailValid;

    // ── Password strength ────────────────────────────────────────
    const getPasswordStrength = (pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
        if (pw.length === 0) return { level: 0, label: '', color: '#D1D1D1' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { level: 1, label: 'Weak', color: '#e53e3e' };
        if (score <= 2) return { level: 2, label: 'Fair', color: '#dd6b20' };
        return { level: 3, label: 'Strong', color: '#38a169' };
    };
    const pwStrength = getPasswordStrength(password);

    // ── OTP bottom-sheet state ───────────────────────────────────
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    // ── Status Modal State ──────────────────────────────────────
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<'error' | 'success'>('error');
    const [statusTitle, setStatusTitle] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const showError = (title: string, message: string) => {
        setStatusTitle(title);
        setStatusMessage(message);
        setStatusType('error');
        setStatusVisible(true);
    };

    const showSuccess = (title: string, message: string) => {
        setStatusTitle(title);
        setStatusMessage(message);
        setStatusType('success');
        setStatusVisible(true);
    };

    const handleVerifyOtp = async () => {
        if (otpLoading || otp.length !== 6) return;
        setOtpLoading(true);
        setOtpError('');
        const { error } = await supabase.auth.verifyOtp({
            email: pendingEmail,
            token: otp,
            type: 'signup',
        });
        setOtpLoading(false);
        if (error) {
            setOtpError(error.message);
            setOtp('');
        }
    };

    const handleResendOtp = async () => {
        setOtp('');
        setOtpError('');
        const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail });
        if (error) setOtpError(error.message);
    };

    // ── Sign Up submit ───────────────────────────────────────────
    const handleSignUp = async () => {
        setEmailTouched(true);
        if (!name.trim() || !password.trim() || !city.trim() || !barangay.trim() || !address.trim() || !phone.trim() || !email.trim()) {
            showError("Missing Info", "Please fill in all fields completely.");
            return;
        }
        if (!isEmailValid) { showError("Invalid Email", "Please enter a valid email address."); return; }
        if (pwStrength.level < 2) { showError("Weak Password", "Add uppercase letters, numbers or symbols."); return; }
        if (phone.length < 8 || phone.length > 11) { showError("Invalid Phone", "Phone number must be 8 to 11 digits."); return; }
        if (!role) { showError("Selection Required", "Please select a role (Donor or Recipient)."); return; }
        
        const numericAge = parseInt(ageText) || 18;

        setSubmitting(true);
        const { data: signUpData, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name.trim() || 'New Member',
                    role: role || 'Donor',
                    phone: phone,
                    city: city,
                    barangay: barangay,
                    address: address,
                    age: numericAge,
                    gender: gender
                },
            },
        });
        setSubmitting(false);

        if (error) { 
            if (!error.message.includes("rate limit")) {
                showError("Signup Failed", error.message); 
                return;
            }
            console.warn("Email Rate Limit Suppressed:", error.message);
        }

        if (signUpData?.user && !signUpData.session) {
            onNeedsVerification(email, role || 'Donor');
        } else if (signUpData?.user && signUpData.session) {
        } else {
            onNeedsVerification(email, role || 'Donor');
        }
    };

    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    const handleNext = () => {
        if (currentStep === 1) {
            if (!name || !email || !password || !role) {
                showError("Incomplete", "Please complete all fields in this step.");
                return;
            }
            if (pwStrength.level < 2) {
                showError("Weak Password", "Password is too weak. Try adding numbers or symbols.");
                return;
            }
            setCurrentStep(2);
        }
    };

    // ── GENDER PICKER VIEW ──
    if (pickingGender) {
        return (
            <LinearGradient colors={['#FFF4F8', '#FFE6F0']} style={styles.root}>
                <View className="flex-1 px-[24px] justify-center">
                    <Text className="text-[32px] font-[900] text-[#1a1a1a] text-center tracking-[-0.5px] mb-[24px]">Select Gender</Text>
                    {GENDERS.map((item) => (
                        <TouchableOpacity
                            key={item}
                            className="p-[16px] w-full border-b-[1px] border-b-[#FFD6EF] items-center"
                            onPress={() => { setGender(item); setPickingGender(false); }}
                        >
                            <Text className="text-black text-[18px] font-bold">{item}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => setPickingGender(false)} className="mt-[24px] p-[12px] items-center">
                        <Text className="text-[#888] text-[16px] font-bold">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }


    return (
        <LinearGradient colors={['#FFF4F8', '#FFEBEB']} style={styles.root}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                className="flex-1"
            >
                <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: ms(24), paddingBottom: vs(48), paddingTop: insets.top + vs(20) }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="items-center mb-[32px]">
                    <Image source={require('../../assets/logo.png')} className="w-[80px] h-[80px] mb-[12px]" resizeMode="contain" />
                    <Text className="text-[32px] font-[900] text-[#1a1a1a] text-center tracking-[-0.5px]">Welcome!</Text>
                    <Text className="text-[15px] text-[#FF1493] font-[800] text-center mt-[4px] uppercase tracking-[1px]">Step {currentStep} of 2</Text>
                </View>

                {currentStep === 1 ? (
                    <Animated.View layout={Layout.springify()} entering={FadeInRight.delay(200)}>
                        <View className="bg-white rounded-[30px] p-[24px] border-[1px] border-[#FFF0F5]" style={styles.premiumShadow}>
                            <Text className="text-[11px] font-black text-[#999] tracking-[1.5px] mb-[16px]">ACCOUNT INFO</Text>

                            {/* Full Name */}
                            <View className="relative">
                                <View className="flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <Ionicons name="person-outline" size={20} color="#FF1493" style={{ marginRight: 10 }} />
                                    <TextInput 
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold" 
                                        value={name} 
                                        onChangeText={setName} 
                                        autoCapitalize="words" 
                                        placeholder="Full Name"
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View className="relative mt-[16px]">
                                <View className="flex-row items-center border-[1.5px] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]"
                                    style={{ borderColor: emailError ? '#e53e3e' : emailTouched && isEmailValid ? '#38a169' : '#FFD6EF' }}>
                                    <Ionicons name="mail-outline" size={20} color="#FF1493" style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={(t) => { setEmail(t); setEmailTouched(true); }}
                                        onBlur={() => setEmailTouched(true)}
                                        autoCapitalize="none"
                                        placeholder="Email Address"
                                    />
                                </View>
                                {emailError && <Text className="text-[#e53e3e] text-[11px] font-bold mt-[4px] ml-[4px]">Enter a valid email</Text>}
                            </View>

                            {/* Password */}
                            <View className="relative mt-[16px]">
                                <View className="flex-row items-center border-[1.5px] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]"
                                    style={{ borderColor: pwStrength.level === 3 ? '#38a169' : pwStrength.level === 2 ? '#dd6b20' : pwStrength.level === 1 ? '#e53e3e' : '#FFD6EF' }}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#FF1493" style={{ marginRight: 10 }} />
                                    <TextInput 
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold" 
                                        secureTextEntry 
                                        value={password} 
                                        onChangeText={setPassword} 
                                        placeholder="Password"
                                    />
                                </View>
                                {/* Strength Bar */}
                                {password.length > 0 && (
                                    <View className="mt-[8px]">
                                        <View className="flex-row gap-[4px]">
                                            {[1, 2, 3].map((seg) => (
                                                <View key={seg} className="flex-1 h-[4px] rounded-[4px]" style={{ backgroundColor: pwStrength.level >= seg ? pwStrength.color : '#EEE' }} />
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>

                            <Text className="text-[11px] font-black text-[#999] tracking-[1.5px] mb-[16px] mt-[24px]">I WANT TO BE A...</Text>
                            <View className="flex-row gap-[16px]">
                                {(["Donor", "Recipient"] as const).map((r) => (
                                    <TouchableOpacity 
                                        key={r} 
                                        className={`flex-1 rounded-[20px] py-[20px] items-center border-[1.5px] ${role === r ? 'bg-white border-[#FF1493]' : 'bg-[#FFF9FB] border-[#FFD6EF]'}`}
                                        style={role === r ? styles.activeRoleShadow : undefined}
                                        onPress={() => setRole(r)}
                                        activeOpacity={0.9}
                                    >
                                        <View className={`w-[60px] h-[60px] rounded-[30px] justify-center items-center mb-[12px] ${role === r ? 'bg-[#FF1493]' : 'bg-white'}`}>
                                            <MaterialCommunityIcons 
                                                name={r === 'Donor' ? 'heart-plus' : 'account-heart'} 
                                                size={32} 
                                                color={role === r ? '#fff' : '#FF66B2'} 
                                            />
                                        </View>
                                        <Text className={`text-[14px] font-extrabold ${role === r ? 'text-[#1a1a1a]' : 'text-[#999]'}`}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <ScaleButton className="bg-[#FF1493] h-[56px] rounded-[20px] justify-center items-center mt-[32px]" onPress={handleNext}>
                                <Text className="text-white font-black text-[16px]">Continue</Text>
                            </ScaleButton>
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View layout={Layout.springify()} entering={FadeInRight.delay(200)}>
                        <View className="bg-white rounded-[30px] p-[24px] border-[1px] border-[#FFF0F5]" style={styles.premiumShadow}>
                            <Text className="text-[11px] font-black text-[#999] tracking-[1.5px] mb-[16px]">CONTACT & LOCATION</Text>

                            {/* Phone */}
                            <View className="relative">
                                <View className="flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <Ionicons name="call-outline" size={20} color="#FF1493" style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                                        maxLength={11}
                                        placeholder="Phone Number"
                                    />
                                </View>
                            </View>

                            {/* Exact Address */}
                            <View className="relative mt-[16px]">
                                <View className="flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <Ionicons name="map-outline" size={20} color="#FF1493" style={{ marginRight: 10 }} />
                                    <TextInput
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold"
                                        value={address}
                                        onChangeText={setAddress}
                                        placeholder="Address (House No., Street)"
                                    />
                                </View>
                            </View>

                            {/* City & Barangay */}
                            <View className="flex-row items-center mt-[16px] gap-[12px]">
                                <View className="flex-1 flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <TextInput className="text-black text-[15px] h-[56px] flex-1 font-semibold" value={city} onChangeText={setCity} placeholder="City" />
                                </View>
                                <View className="flex-1 flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <TextInput className="text-black text-[15px] h-[56px] flex-1 font-semibold" value={barangay} onChangeText={setBarangay} placeholder="Barangay" />
                                </View>
                            </View>

                            <View className="flex-row items-center mt-[16px] gap-[12px]">
                                <View className="flex-1 flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB]">
                                    <TextInput 
                                        className="text-black text-[15px] h-[56px] flex-1 font-semibold" 
                                        value={ageText} 
                                        onChangeText={setAgeText}
                                        keyboardType="number-pad" 
                                        maxLength={3}
                                        placeholder="Age"
                                    />
                                </View>
                                <TouchableOpacity
                                    className="flex-[1.5] flex-row items-center border-[1.5px] border-[#FFD6EF] rounded-[15px] h-[56px] px-[16px] bg-[#FFF9FB] justify-between"
                                    onPress={() => setPickingGender(true)}
                                >
                                    <Text className={`text-[15px] ${gender ? 'text-black' : 'text-[#888]'}`}>{gender || 'Gender'}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#FF1493" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row gap-[12px] mt-[32px]">
                                <ScaleButton 
                                    className="flex-1 h-[56px] rounded-[20px] justify-center items-center bg-[#EEE]"
                                    onPress={() => setCurrentStep(1)}
                                >
                                    <Text className="text-[#888] font-black text-[16px]">Back</Text>
                                </ScaleButton>
                                <ScaleButton 
                                    className="flex-[2] h-[56px] rounded-[20px] justify-center items-center bg-[#FF1493]"
                                    onPress={handleSignUp}
                                >
                                    {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-[16px]">Complete Sign Up</Text>}
                                </ScaleButton>
                            </View>
                        </View>
                    </Animated.View>
                )}

                    <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.8} className="self-center mt-[24px] p-[8px]">
                        <Text className="text-[#888] font-bold text-[14px]">Already have an account? <Text className="text-[#FF1493]">Log In</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <AuthStatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    // Premium Shadows Retained
    premiumShadow: { 
        shadowColor: '#FF66B2', 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 20, 
        elevation: 5,
    },
    activeRoleShadow: { 
        shadowColor: '#FF1493',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3
    },
});
