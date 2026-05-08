import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vs } from '../../lib/scaling';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import AuthStatusModal from "../../components/AuthStatusModal";

interface VerificationScreenProps {
    email: string;
    onVerified: () => void;      // called after successful OTP — App.tsx takes over
    onGoBack: () => void;        // go back to signup
}

export default function VerificationScreen({
    email,
    onVerified,
    onGoBack,
}: VerificationScreenProps) {
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const otpInputRef = useRef<TextInput>(null);

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

    useEffect(() => {
        let interval: any;
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer, canResend]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError("Please enter all 6 digits.");
            return;
        }
        setError("");
        setLoading(true);
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "signup",
        });
        setLoading(false);
        if (verifyError) {
            showError("Verification Failed", verifyError.message);
        } else {
            onVerified();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        
        setOtp("");
        setError("");
        setLoading(true);
        const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email,
        });
        setLoading(false);
        
        if (resendError) {
            showError("Resend Failed", resendError.message);
        } else {
            setTimer(60);
            setCanResend(false);
            showSuccess("Code Resent", "A new 6-digit code has been sent via Resend SMTP! ✨");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
        >
            <LinearGradient
                colors={["#FF1493", "#FF69B4", "#FFF0F5"]}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="items-center px-[24px] py-[20px]" style={{ paddingTop: insets.top + vs(20) }}>

                        {/* Premium Header Icon */}
                        <Animated.View entering={FadeInDown.duration(800)} className="justify-center items-center mb-[25px] border-[2px] border-white/30 bg-white/20 w-[100px] h-[100px] rounded-[50px]">
                             <LinearGradient
                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                                className="w-full h-full rounded-[50px] justify-center items-center"
                            >
                                <Ionicons name="mail-open" size={44} color="#fff" />
                            </LinearGradient>
                        </Animated.View>

                        <Animated.Text entering={FadeInUp.delay(200)} className="text-[32px] font-black text-white text-center mb-[10px]">
                            Verify Account
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(300)} className="text-[13px] text-white/85 text-center leading-[20px] max-w-[90%] mt-[8px]">
                            Can't find the email? Check your <Text className="font-black text-white">Spam</Text> or <Text className="font-black text-white">Junk</Text> folder. It might be hiding there!
                        </Animated.Text>

                        {/* Enhanced OTP Card */}
                        <Animated.View 
                            layout={Layout.springify()}
                            entering={FadeInUp.delay(500)} 
                            className="bg-white rounded-[35px] py-[35px] px-[25px] w-full mt-[35px] items-center"
                            style={styles.premiumShadow}
                        >
                            <Text className="text-[13px] font-[800] text-[#BBB] mb-[25px] tracking-[2px]">
                                ENTER 6-DIGIT CODE
                            </Text>

                            {/* OTP Boxes Rendering */}
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => otpInputRef.current?.focus()}
                                className="flex-row items-center mb-[10px]"
                            >
                                {Array.from({ length: 6 }).map((_, i) => {
                                    const isActive = otp.length === i;
                                    const isFilled = otp.length > i;
                                    return (
                                        <View key={i} className={`w-[42px] h-[55px] rounded-[14px] mx-[4px] justify-center items-center ${isActive ? 'border-[2.5px]' : 'border-[1.5px]'} ${isFilled ? 'bg-[#FFF0F5]' : 'bg-[#F8F9FA]'} ${isActive ? 'border-[#FF1493]' : isFilled ? 'border-[#FF69B4]' : 'border-[#E9ECEF]'}`}>
                                            {isFilled ? (
                                                <Text className="text-[24px] font-black text-[#333]">{otp[i]}</Text>
                                            ) : isActive ? (
                                                <View className="w-[2px] h-[22px] bg-[#FF1493]" />
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </TouchableOpacity>

                            <TextInput
                                ref={otpInputRef}
                                value={otp}
                                onChangeText={(text) => {
                                    setError("");
                                    setOtp(text.replace(/[^0-9]/g, "").slice(0, 6));
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                                className="absolute opacity-0 h-0 w-0"
                                autoFocus
                            />

                            {error ? (
                                <Animated.View entering={FadeInDown} className="flex-row items-center mt-[15px] bg-[#FEF2F2] px-[12px] py-[8px] rounded-[10px]">
                                    <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                                    <Text className="text-[#EF4444] text-[12px] font-bold">{error}</Text>
                                </Animated.View>
                            ) : <View style={{ height: 20 }} />}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleVerify}
                                disabled={loading || otp.length < 6}
                                className={`w-full h-[58px] rounded-[20px] justify-center items-center mt-[15px] ${otp.length < 6 ? 'bg-[#FFD6EF]' : 'bg-[#FF1493]'}`}
                                style={{
                                    shadowColor: "#FF1493",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: otp.length < 6 ? 0 : 0.3,
                                    shadowRadius: 15,
                                    elevation: otp.length < 6 ? 0 : 8,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-black text-[17px] tracking-[1px]">
                                        VERIFY NOW
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Resend Logic with Timer */}
                            <View className="mt-[25px] items-center">
                                {canResend ? (
                                    <TouchableOpacity onPress={handleResend} className="flex-row items-center">
                                        <Feather name="refresh-cw" size={14} color="#FF1493" style={{ marginRight: 6 }} />
                                        <Text className="text-[#FF1493] font-[800] text-[14px]">Resend New Code</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text className="text-[#BBB] text-[14px] font-semibold">
                                        Resend code in <Text className="text-[#FF1493] font-[800]">{timer}s</Text>
                                    </Text>
                                )}
                            </View>
                        </Animated.View>

                        {/* Elegant Back Navigation */}
                        <TouchableOpacity
                            onPress={onGoBack}
                            className="mt-[30px] p-[10px]"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white/70 font-[800] text-[14px] underline">
                                Use a different email address
                            </Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </LinearGradient>

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
    premiumShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    }
});
