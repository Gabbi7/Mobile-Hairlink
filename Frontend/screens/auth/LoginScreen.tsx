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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../lib/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import AuthStatusModal from "../../components/AuthStatusModal";
import { supabase } from "../../lib/supabase";

interface LoginScreenProps {
    onLogin: (role: "Donor" | "Recipient") => void;
    onSwitchToSignup: () => void;
    onForgotPassword?: () => void;
    onPasswordRecovery?: () => void;
}

export default function LoginScreen({
    onLogin,
    onSwitchToSignup,
    onForgotPassword,
    onPasswordRecovery,
}: LoginScreenProps) {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    // Forgot password simple state (no sub-modals for stability)
    const [viewMode, setViewMode] = useState<"login" | "forgot_email" | "forgot_otp">("login");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const otpInputRef = React.useRef<TextInput>(null);

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

    // Auto-focus OTP input when entering the view
    React.useEffect(() => {
        if (viewMode === "forgot_otp") {
            const timer = setTimeout(() => {
                otpInputRef.current?.focus();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [viewMode]);

    const showSuccess = (title: string, message: string) => {
        setStatusTitle(title);
        setStatusMessage(message);
        setStatusType('success');
        setStatusVisible(true);
    };

    // Auto-focus OTP input when entering the view
    React.useEffect(() => {
        if (viewMode === "forgot_otp") {
            const timer = setTimeout(() => {
                otpInputRef.current?.focus();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [viewMode]);

    // ── Login ────────────────────────────────────────────────────
    const handleLogin = async () => {
        let valid = true;
        if (!email.trim()) { setEmailError("Required"); valid = false; } else setEmailError("");
        if (!password.trim()) { setPasswordError("Required"); valid = false; } else setPasswordError("");
        if (!valid) return;

        setLoggingIn(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                     showError("Verification Required", "Please check your email and verify your account before logging in.");
                } else {
                     showError("Login Failed", error.message);
                }
                return;
            }

            // Authentication succeeded, App.tsx listener will catch the session change
            // No need to fetch role here as App.tsx handles the routing logic
            
        } catch (error: any) {
            showError("Login Error", error.message || "An unexpected error occurred");
        } finally {
            setLoggingIn(false);
        }
    };

    // ── Forgot password flow ─────────────────────────────────────
    const handleSendResetCode = async () => {
        if (!forgotEmail.trim()) { setForgotError("Please enter your email."); return; }
        setForgotLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
        setForgotLoading(false);
        if (error) {
            setForgotError(error.message);
        } else {
            showSuccess("Email Sent", "Password reset instructions have been sent to your email.");
            setViewMode("forgot_otp");
        }
    };

    const handleVerifyResetCode = async () => {
        if (forgotOtp.length !== 6) { setForgotError("Please enter the complete 6-digit code."); return; }
        setForgotLoading(true);
        setForgotError("");
        
        const { error } = await supabase.auth.verifyOtp({ email: forgotEmail, token: forgotOtp, type: "recovery" });
        setForgotLoading(false);
        if (error) { setForgotError(error.message); return; }

        // Success! Now let App.tsx know we are ready to reset.
        if (onPasswordRecovery) onPasswordRecovery();
    };

    // ── Render Forgot Email View ────────────────────────────────
    if (viewMode === "forgot_email") {
        return (
            <LinearGradient colors={["#FF1493", "#FF69B4", "#FFF0F5"]} style={styles.root}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"} 
                    className="flex-1"
                >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + vs(20) }} bounces={false} keyboardShouldPersistTaps="handled">
                    <View className="items-center px-[24px] py-[40px]">
                        <Animated.View entering={FadeInDown.duration(800)} className="w-[100px] h-[100px] rounded-[50px] bg-white/20 justify-center items-center mb-[25px] border-[2px] border-white/30">
                             <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} className="w-full h-full rounded-[50px] justify-center items-center">
                                <Ionicons name="lock-closed" size={44} color="#fff" />
                            </LinearGradient>
                        </Animated.View>

                        <Animated.Text entering={FadeInUp.delay(200)} className="text-[32px] font-black text-white text-center mb-[10px]">Forgot Password?</Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(300)} className="text-[13px] text-white/85 text-center leading-[20px] max-w-[90%] mt-[8px]">
                            Enter your email address and we'll send a 6-digit code to reset your password.
                        </Animated.Text>

                        <Animated.View entering={FadeInUp.delay(500)} className="bg-white rounded-[35px] py-[35px] px-[25px] w-full mt-[35px] items-center" style={styles.premiumShadow}>
                            <Text className="text-[13px] font-[800] text-[#BBB] mb-[15px] tracking-[2px]">EMAIL ADDRESS</Text>
                            <View className="w-full bg-white rounded-[12px] border-[1.5px] h-[50px] flex-row items-center px-[14px] border-[#E9ECEF] mt-[8px] mb-[12px]">
                                <Ionicons name="mail-outline" size={20} color="#D1D1D1" />
                                <TextInput
                                    className="flex-1 ml-[10px] text-[15px] text-black h-[48px]"
                                    value={forgotEmail}
                                    onChangeText={(t) => { setForgotEmail(t); setForgotError(""); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="Your email address"
                                    placeholderTextColor="#bbb"
                                />
                            </View>

                            {forgotError ? <Text className="text-[#e53e3e] text-[12px] font-bold ml-[4px] mb-[8px] self-start">{forgotError}</Text> : null}

                            <TouchableOpacity 
                                className="w-full h-[54px] rounded-[27px] bg-[#FF66B2] justify-center items-center mb-[16px]"
                                onPress={handleSendResetCode} 
                                disabled={forgotLoading}
                            >
                                {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[18px]">Send reset code</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setViewMode("login")} className="mt-[20px] p-[8px]">
                                <Text className="text-[#999] text-[14px] font-bold underline">Back to Login</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
        );
    }

    // ── Render Forgot OTP View ────────────────────────────────
    if (viewMode === "forgot_otp") {
        return (
            <LinearGradient colors={["#FF1493", "#FF69B4", "#FFF0F5"]} style={styles.root}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"} 
                    className="flex-1"
                >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + vs(20) }} bounces={false} keyboardShouldPersistTaps="handled">
                    <View className="items-center px-[24px] py-[40px]">
                        <Animated.View entering={FadeInDown.duration(800)} className="w-[100px] h-[100px] rounded-[50px] bg-white/20 justify-center items-center mb-[25px] border-[2px] border-white/30">
                            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} className="w-full h-full rounded-[50px] justify-center items-center">
                                <Ionicons name="mail-open" size={44} color="#fff" />
                            </LinearGradient>
                        </Animated.View>

                        <Animated.Text entering={FadeInUp.delay(200)} className="text-[32px] font-black text-white text-center mb-[10px]">Verify Code</Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(300)} className="text-[13px] text-white/85 text-center leading-[20px] max-w-[90%] mt-[8px]">
                            We've sent a 6-digit code to <Text className="font-[900] text-white">{forgotEmail}</Text>
                        </Animated.Text>

                        <Animated.View 
                            layout={Layout.springify()}
                            entering={FadeInUp.delay(500)} 
                            className="bg-white rounded-[35px] py-[35px] px-[25px] w-full mt-[35px] items-center"
                            style={styles.premiumShadow}
                        >
                            <Text className="text-[13px] font-[800] text-[#BBB] mb-[15px] tracking-[2px]">ENTER 6-DIGIT CODE</Text>

                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => otpInputRef.current?.focus()}
                                className="flex-row items-center mb-[10px]"
                            >
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const isActive = forgotOtp.length === i;
                                    const isFilled = forgotOtp.length > i;
                                    return (
                                        <View key={i} className={`w-[36px] h-[48px] rounded-[12px] mx-[3px] border-[1.5px] justify-center items-center ${isFilled ? 'bg-[#FFF0F5] border-[#FF69B4]' : isActive ? 'bg-[#F8F9FA] border-[#FF1493] border-[2.5px]' : 'bg-[#F8F9FA] border-[#E9ECEF]'}`}>
                                            {isFilled ? (
                                                <Text className="text-[20px] font-black text-[#333]">{forgotOtp[i]}</Text>
                                            ) : isActive ? (
                                                <View className="w-[2px] h-[18px] bg-[#FF1493]" />
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </TouchableOpacity>

                            <TextInput
                                ref={otpInputRef}
                                value={forgotOtp}
                                onChangeText={(text) => {
                                    setForgotError("");
                                    setForgotOtp(text.replace(/[^0-9]/g, "").slice(0, 6));
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
                                autoFocus
                            />

                            {forgotError ? <Text className="text-[#e53e3e] text-[12px] font-bold text-center w-full mt-[10px]">{forgotError}</Text> : <View style={{ height: 20 }} />}

                            <TouchableOpacity 
                                className={`w-full h-[54px] rounded-[27px] bg-[#FF66B2] justify-center items-center mb-[16px] mt-[15px] ${forgotOtp.length < 6 ? 'opacity-70' : 'opacity-100'}`}
                                onPress={handleVerifyResetCode} 
                                disabled={forgotLoading || forgotOtp.length < 6}
                            >
                                {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[18px]">Verify and continue</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => { setViewMode("forgot_email"); setForgotOtp(""); }} className="mt-[20px] p-[8px]">
                                <Text className="text-[#999] text-[14px] font-bold underline">Change email address</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            className="flex-1 bg-[#FFF4F8]"
            style={{ paddingTop: insets.top }}
        >
            <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <View className="px-[32px] py-[40px] items-center w-full" style={{ paddingTop: vs(20) }}>
                    {/* Logo */}
                    <Image 
                        source={require("../../assets/logo.png")} 
                        className="w-[120px] h-[120px] mb-[16px]" 
                        resizeMode="contain" 
                    />

                    <Text className="text-[32px] font-[800] text-[#FF1493] tracking-[0.5px] mb-[6px] text-center">Welcome!</Text>
                    <Text className="text-[14px] font-[600] text-[#555] mb-[32px] text-center">join us by signing up and let's get started!</Text>

                    {/* Email */}
                    <Text className="text-[13px] font-[700] text-[#333] mb-[6px] ml-[2px] self-start w-full">Email</Text>
                    <View 
                        className="w-full bg-white rounded-[12px] border-[1.5px] h-[50px] flex-row items-center px-[14px]"
                        style={{ borderColor: emailError ? '#e53e3e' : '#FF66CC', marginBottom: emailError ? 4 : 16 }}
                    >
                        <Ionicons name="mail-outline" size={20} color="#D1D1D1" />
                        <TextInput
                            className="flex-1 ml-[10px] text-[15px] text-black h-[48px]"
                            value={email}
                            onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(""); }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#bbb"
                        />
                    </View>
                    {emailError ? <Text className="text-[#e53e3e] text-[12px] font-bold ml-[4px] mb-[8px] self-start">{emailError}</Text> : null}

                    {/* Password */}
                    <Text className="text-[13px] font-[700] text-[#333] mb-[6px] ml-[2px] self-start w-full mt-[8px]">Password</Text>
                    <View 
                        className="w-full bg-white rounded-[12px] border-[1.5px] h-[50px] flex-row items-center px-[14px]"
                        style={{ borderColor: passwordError ? '#e53e3e' : '#FF66CC', marginBottom: passwordError ? 4 : 0 }}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color="#D1D1D1" />
                        <TextInput
                            className="flex-1 ml-[10px] text-[15px] text-black h-[48px]"
                            value={password}
                            onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(""); }}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#bbb"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7} style={{ padding: 4 }}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#D1D1D1" />
                        </TouchableOpacity>
                    </View>
                    {passwordError?.trim() ? <Text className="text-[#e53e3e] text-[12px] font-bold ml-[4px] mb-[8px] self-start">{passwordError}</Text> : null}

                    {/* Forgot password */}
                    <TouchableOpacity onPress={() => setViewMode("forgot_email")} activeOpacity={0.8} className="self-end mt-[12px] py-[4px]">
                        <Text className="text-[13px] font-bold text-[#FF1493]">Forgot Password?</Text>
                    </TouchableOpacity>

                    <View style={{ height: 48 }} />

                    {/* Login Button */}
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={handleLogin} 
                        disabled={loggingIn} 
                        className="w-full h-[54px] rounded-[27px] bg-[#FF66B2] justify-center items-center mb-[16px]"
                    >
                        {loggingIn ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[18px]">Login</Text>}
                    </TouchableOpacity>

                    {/* Switch to Sign Up */}
                    <TouchableOpacity onPress={onSwitchToSignup} activeOpacity={0.8} className="self-center mt-[16px] p-[8px]">
                        <Text className="text-[14px] font-medium text-[#555]">
                            Don't have an account? <Text className="font-black text-[#FF1493]">Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <AuthStatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFF4F8' },
    // Premium UI Additions
    premiumShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
});
