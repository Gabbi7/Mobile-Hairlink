import React, { useState, useEffect, useCallback, useRef } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, vs } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import api from '../../lib/api';

import MonetaryDonationDashboard from './MonetaryDonationDashboard';
import HairDonationScreen from './HairDonationScreen';
import DonorCalendarScreen from './DonorCalendarScreen';
import NotificationScreen from './NotificationScreen';
import DonationHistoryScreen from './DonationHistoryScreen';
import ProfileScreen from './ProfileScreen';
import ARScreen from '../ar/ARScreen';

interface DonorDashboardProps {
  onLogout?: () => void;
  onRoleChange?: (role: 'Donor' | 'Recipient') => void;
  userName?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const shadows = {
  header: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 8,
  },
  hero: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCTA: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  partner: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  event: {
    shadowColor: '#FF1493',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomNav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
  },
  arButton: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 12,
  },
};

const ScaleButton = ({ children, onPress, className = '', style }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 10, stiffness: 200 }))}
      onPressOut={() => (scale.value = withSpring(1))}
      className={className}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTouchable>
  );
};

export default function DonorDashboard({ onLogout, onRoleChange, userName = 'Donor' }: DonorDashboardProps) {
  const [showMonetary, setShowMonetary] = useState(false);
  const [showHairDonation, setShowHairDonation] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [starPoints, setStarPoints] = useState(0);
  const [referralCode, setReferralCode] = useState('---');
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsViewedRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 30, secs: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPoints = useCallback(async () => {
    try {
      const response = await api.get('/me');
      if (response.data) {
        setStarPoints(response.data.star_points || 0);
        setReferralCode(response.data.referral_code || '---');
      }
    } catch (err) {
      console.log('Error fetching user data:', err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log('Error fetching unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
    fetchUnreadCount();
  }, [fetchPoints, fetchUnreadCount]);

  useEffect(() => {
    if (!showMonetary && !showHairDonation && !showCalendar && !showNotifications && !showHistory && !showProfile) {
      fetchPoints();
      if (!notificationsViewedRef.current) {
        fetchUnreadCount();
      }
    }
  }, [showMonetary, showHairDonation, showCalendar, showNotifications, showHistory, showProfile, fetchPoints, fetchUnreadCount]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied', `Referral code "${referralCode}" copied to clipboard!`);
  };

  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open link'));
  };

  const insets = useSafeAreaInsets();

  if (showMonetary) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <MonetaryDonationDashboard
          onBack={() => setShowMonetary(false)}
          onSuccess={() => {
            setShowMonetary(false);
            setShowNotifications(true);
          }}
        />
      </Animated.View>
    );
  }

  if (showHairDonation) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <HairDonationScreen
          onBack={() => setShowHairDonation(false)}
          onSuccess={() => {
            setShowHairDonation(false);
            setShowNotifications(true);
          }}
        />
      </Animated.View>
    );
  }

  if (showCalendar) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <DonorCalendarScreen onBack={() => setShowCalendar(false)} />
      </Animated.View>
    );
  }

  if (showNotifications) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <NotificationScreen onBack={() => setShowNotifications(false)} role="Donor" />
      </Animated.View>
    );
  }

  if (showHistory) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <DonationHistoryScreen onBack={() => setShowHistory(false)} />
      </Animated.View>
    );
  }

  if (showProfile) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <ProfileScreen
          onBack={() => setShowProfile(false)}
          onLogout={onLogout || (() => { })}
          onRoleChange={onRoleChange}
        />
      </Animated.View>
    );
  }

  if (showAR) {
    return (
      <Animated.View
        className="flex-1"
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <ARScreen onBack={() => setShowAR(false)} />
      </Animated.View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8F0F5]" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <Animated.View entering={FadeIn.duration(400)}>
        <LinearGradient
          colors={['rgba(255, 102, 204, 0.88)', 'rgba(255, 153, 221, 0.88)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-b-[24px]"
          style={[shadows.header]}
        >
          <View
            className="flex-row items-center border-b-[1.5px] border-b-white/30"
            style={{ paddingHorizontal: ms(16), paddingVertical: vs(14), borderBottomLeftRadius: ms(24), borderBottomRightRadius: ms(24) }}
          >
            <Image
              source={require('../../assets/logo.png')}
              className="bg-white"
              style={{ width: ms(44), height: ms(44), borderRadius: ms(22) }}
              resizeMode="contain"
            />
            <View className="flex-1 ml-[12px]">
              <Text className="text-white/90 font-semibold" style={{ fontSize: ms(12) }}>Welcome back 👋</Text>
              <Text className="text-white font-black" style={{ fontSize: ms(19) }} numberOfLines={1}>{userName}</Text>
            </View>
            <ScaleButton
              onPress={() => setShowProfile(true)}
              className="bg-white/20 items-center justify-center rounded-full"
              style={{ width: ms(40), height: ms(40) }}
            >
              <Ionicons name="person" size={22} color="#fff" />
            </ScaleButton>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: vs(160) }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify().delay(100)} className="m-[14px] mb-[15px]">
          <LinearGradient
            colors={['#FFF0F8', '#FFD6EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[22px]"
            style={[shadows.hero]}
          >
            <View style={{ padding: ms(22) }}>
              <Text className="font-black text-[#1a1a1a] mb-[6px]" style={{ fontSize: ms(26), lineHeight: vs(32) }}>
                STRAND UP{`\n`}FOR CANCER
              </Text>
              <Text className="text-[#FF1493] font-bold mb-[18px]" style={{ fontSize: ms(13) }}>
                Hope begins, one strand at a time
              </Text>
              <ScaleButton
                className="self-start bg-[#FF66B2] rounded-full shadow-md"
                style={[{ paddingHorizontal: ms(26), paddingVertical: vs(12) }, shadows.heroCTA]}
                onPress={() => setShowMonetary(true)}
              >
                <Text className="text-white font-black" style={{ fontSize: ms(15) }}>Donate Now →</Text>
              </ScaleButton>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          entering={FadeInRight.springify().delay(200)}
          className="bg-white mx-[14px] mb-[14px] rounded-[20px]"
          style={[{ padding: ms(18) }, shadows.card]}
        >
          <View className="flex-row items-center justify-between mb-[14px]">
            <Ionicons name="star" size={20} color="#FF1493" />
            <Text className="font-extrabold text-[#1a1a1a] flex-1" style={{ fontSize: ms(16) }}>  Star Points</Text>
            <TouchableOpacity onPress={() => setShowHistory(true)}>
              <View className="flex-row items-center bg-[#FFF0F8] rounded-[8px] mr-[10px]" style={{ paddingHorizontal: ms(8), paddingVertical: vs(4) }}>
                <MaterialCommunityIcons name="history" size={16} color="#FF1493" />
                <Text className="font-extrabold text-[#FF1493] ml-[4px]" style={{ fontSize: ms(11) }}>View History</Text>
              </View>
            </TouchableOpacity>
            <Text className="font-extrabold text-[#FF1493] bg-[#FFF0F8] rounded-[12px]" style={{ fontSize: ms(14), paddingHorizontal: ms(10), paddingVertical: vs(4) }}>
              {starPoints} ⭐
            </Text>
          </View>

          <View className="bg-[#F0F0F0] rounded-[8px] mb-[6px]" style={{ height: vs(8) }}>
            <View
              className="bg-[#FF66CC] rounded-[8px]"
              style={{ height: vs(8), width: `${Math.min((starPoints / 100) * 100, 100)}%` }}
            />
          </View>
          <Text className="text-[#999] font-semibold mb-[12px]" style={{ fontSize: ms(11) }}>
            {starPoints} / 100 pts — Free wig at 100!
          </Text>

          <View className="flex-row justify-between">
            {Array.from({ length: 9 }).map((_, i) => (
              <Text key={i} style={{ fontSize: ms(16) }}>⭐</Text>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.springify().delay(300)} className="flex-row items-center mx-[14px] mb-[14px]">
          <Text className="font-bold text-[#333] mr-[10px]" style={{ fontSize: ms(15) }}>Referral Code:</Text>
          <ScaleButton
            className="flex-1 flex-row items-center justify-between border-[1.5px] border-[#FF66CC] rounded-[14px] bg-white"
            style={{ paddingHorizontal: ms(16), paddingVertical: vs(12) }}
            onPress={copyToClipboard}
          >
            <View className="flex-1 flex-row items-center justify-between pr-[16px]">
              <Text className="font-extrabold text-[#FF1493]" style={{ fontSize: ms(16), letterSpacing: ms(2) }}>{referralCode}</Text>
              <Ionicons name="copy-outline" size={18} color="#FF1493" />
            </View>
          </ScaleButton>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.springify().delay(400)}
          className="bg-white mx-[14px] mb-[14px] rounded-[20px]"
          style={[{ padding: ms(18) }, shadows.card]}
        >
          <Text className="font-black text-[#1a1a1a] text-center mb-[4px]" style={{ fontSize: ms(18) }}>How It Works</Text>
          <Text className="text-[#888] text-center mb-[18px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>
            Give the gift of confidence — donate hair or support financially.
          </Text>

          <View className="flex-row">
            <View className="flex-1 border-[1.5px] border-[#FFD6EF] rounded-[18px] items-center mx-[4px] bg-[#FFFAFC]" style={{ padding: ms(14) }}>
              <View className="bg-[#FFF0F8] justify-center items-center mb-[10px]" style={{ width: ms(54), height: ms(54), borderRadius: ms(27) }}>
                <Ionicons name="cut-outline" size={28} color="#FF1493" />
              </View>
              <Text className="font-black text-[#1a1a1a] mb-[6px] text-center" style={{ fontSize: ms(15) }}>Donate Hair</Text>
              <Text className="text-[#888] text-center mb-[14px] flex-1" style={{ fontSize: ms(11), lineHeight: vs(16) }}>
                Give your hair to someone in need.
              </Text>
              <ScaleButton
                className="bg-[#FF66B2] rounded-[16px] self-stretch items-center"
                style={{ paddingHorizontal: ms(20), paddingVertical: vs(8) }}
                onPress={() => setShowHairDonation(true)}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: ms(13) }}>Donate</Text>
              </ScaleButton>
            </View>

            <View className="flex-1 border-[1.5px] border-[#FFD6EF] rounded-[18px] items-center mx-[4px] bg-[#FFFAFC]" style={{ padding: ms(14) }}>
              <View className="bg-[#FFF0F8] justify-center items-center mb-[10px]" style={{ width: ms(54), height: ms(54), borderRadius: ms(27) }}>
                <Ionicons name="cash-outline" size={28} color="#FF1493" />
              </View>
              <Text className="font-black text-[#1a1a1a] mb-[6px] text-center" style={{ fontSize: ms(15) }}>Monetary</Text>
              <Text className="text-[#888] text-center mb-[14px] flex-1" style={{ fontSize: ms(11), lineHeight: vs(16) }}>
                Support our mission and earn points.
              </Text>
              <ScaleButton
                className="bg-[#FF66B2] rounded-[16px] self-stretch items-center"
                style={{ paddingHorizontal: ms(20), paddingVertical: vs(8) }}
                onPress={() => setShowMonetary(true)}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: ms(13) }}>Give</Text>
              </ScaleButton>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.springify().delay(500)}
          className="mx-[14px] mb-[24px] rounded-[18px] overflow-hidden bg-[#FFF0F8]"
          style={{ elevation: 3 }}
        >
          <Image
            source={require('../../assets/group.jpg')}
            className="w-full"
            style={{ height: vs(250) }}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().delay(600)} className="items-center mb-[30px]" style={{ paddingHorizontal: ms(20) }}>
          <View className="flex-row items-center justify-center mb-[12px]">
            <Text className="font-black text-[#1a1a1a] mr-[8px]" style={{ fontSize: ms(26) }}>About Us</Text>
            <MaterialCommunityIcons name="ribbon" size={32} color="#FF66B2" style={{ transform: [{ rotate: '15deg' }] }} />
          </View>
          <Text className="text-[#333] text-center font-medium" style={{ fontSize: ms(14), lineHeight: vs(22) }}>
            Strand Up for Cancer (SUFC) is a youth-led initiative of the Manila Downtown YMCA Youth Club dedicated to supporting patients who experience long-term hair loss caused by illness and medical treatment. Through hair donations, we craft wigs that restore not only appearance but also a sense of dignity, comfort, and renewed self-confidence. Each strand given is more than just hair-it’s a gift of hope and strength.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInRight.springify().delay(700)} className="mb-[30px]">
          <Text className="font-black text-[#1a1a1a] text-center mb-[4px]" style={{ fontSize: ms(18) }}>Our Partners</Text>
          <View className="flex-row justify-around px-[10px] mt-[14px]">
            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#FFF0F8]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.partner]}
              onPress={() => handleOpenURL('https://web.facebook.com/ManilaDowntownYMCAYouthClub')}
            >
              <View className="bg-[#FFFAFC] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/ymca.jpg')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>YMCA Youth Club</Text>
            </ScaleButton>

            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#FFF0F8]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.partner]}
              onPress={() => handleOpenURL('https://web.facebook.com/Richarddmanilawigmaker')}
            >
              <View className="bg-[#FFFAFC] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/RDM.png')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>Richard D. Manila</Text>
            </ScaleButton>

            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#FFF0F8]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.partner]}
              onPress={() => handleOpenURL('https://pgh.gov.ph/')}
            >
              <View className="bg-[#FFFAFC] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/pgh_logo.png')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>PGH Hospital</Text>
            </ScaleButton>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().delay(800)} className="mx-[14px] mb-[30px]">
          <TouchableOpacity activeOpacity={0.9} onPress={() => setShowCalendar(true)}>
            <LinearGradient
              colors={['#FF1493', '#FF66B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="border-2 border-white/20"
              style={[{
                padding: ms(24),
                borderTopLeftRadius: ms(25),
                borderBottomRightRadius: ms(25),
                borderTopRightRadius: ms(25),
                borderBottomLeftRadius: ms(25)
              }, shadows.event]}
            >
              <View className="flex-row justify-between items-center mb-[10px]">
                <Text className="font-black text-white/80 tracking-[1.5px]" style={{ fontSize: ms(11) }}>UPCOMING EVENT</Text>
                <Ionicons name="calendar" size={20} color="#fff" />
              </View>
              <Text className="font-black text-white mb-[4px]" style={{ fontSize: ms(22) }}>Annual Grand Hair Drive</Text>
              <Text className="text-white/90 font-semibold mb-[20px]" style={{ fontSize: ms(12) }}>Manila Downtown YMCA Auditorium</Text>

              <View className="flex-row items-center justify-center bg-black/15 rounded-[24px]" style={{ paddingVertical: vs(12) }}>
                {['DAYS', 'HOURS', 'MINS', 'SECS'].map((unit, idx) => {
                  const val = unit === 'DAYS' ? timeLeft.days : unit === 'HOURS' ? timeLeft.hours : unit === 'MINS' ? timeLeft.mins : timeLeft.secs;
                  return (
                    <React.Fragment key={unit}>
                      <View className="items-center" style={{ width: ms(60) }}>
                        <Text className="font-black text-white" style={{ fontSize: ms(22) }}>{val}</Text>
                        <Text className="font-extrabold text-white/70 mt-[2px]" style={{ fontSize: ms(9) }}>{unit}</Text>
                      </View>
                      {idx < 3 && <Text className="text-white font-black mx-[4px]" style={{ fontSize: ms(22), marginTop: vs(-10) }}>:</Text>}
                    </React.Fragment>
                  );
                })}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row items-start justify-around border-t border-[#FFD6EF]/40 shadow-2xl"
        style={[{ height: vs(68) + insets.bottom, paddingHorizontal: ms(8), paddingTop: vs(8) }, shadows.bottomNav]}
      >
        <ScaleButton className="items-center justify-center" style={{ width: ms(64) }} onPress={() => { }}>
          <View className="bg-gray-50 rounded-full items-center justify-center mb-[2px]" style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="home" size={ms(24)} color="#FF1493" />
          </View>
          <Text className="text-[#FF1493] font-black" style={{ fontSize: ms(10) }}>Home</Text>
        </ScaleButton>

        <ScaleButton className="items-center justify-center" style={{ width: ms(64) }} onPress={() => setShowCalendar(true)}>
          <View className="bg-gray-50 rounded-full items-center justify-center mb-[2px]" style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="calendar-outline" size={ms(26)} color="#888" />
          </View>
          <Text className="text-[#888] font-bold" style={{ fontSize: ms(10) }}>Schedule</Text>
        </ScaleButton>

        <ScaleButton
          className="bg-[#FF1493] items-center justify-center border-[4px] border-white shadow-2xl"
          style={[{ width: ms(62), height: ms(62), borderRadius: ms(31), marginTop: vs(-38) }, shadows.arButton]}
          onPress={() => setShowAR(true)}
        >
          <MaterialCommunityIcons name="augmented-reality" size={ms(32)} color="#fff" />
        </ScaleButton>

        <ScaleButton
          className="items-center justify-center"
          style={{ width: ms(64) }}
          onPress={() => {
            setShowNotifications(true);
            setUnreadCount(0);
            notificationsViewedRef.current = true;
          }}
        >
          <View className="bg-gray-50 rounded-full items-center justify-center mb-[2px]" style={{ width: ms(40), height: ms(40) }}>
            <View className="relative">
              <Ionicons name="notifications-outline" size={ms(24)} color="#888" />
              {unreadCount > 0 && (
                <View
                  className="absolute bg-[#FF1493] justify-center items-center border-2 border-white"
                  style={{ top: -ms(4), right: -ms(6), borderRadius: ms(9), minWidth: ms(18), height: ms(18), paddingHorizontal: ms(4) }}
                >
                  <Text className="text-white font-black" style={{ fontSize: ms(9) }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text className="text-[#888] font-bold" style={{ fontSize: ms(10) }}>Alerts</Text>
        </ScaleButton>

        <ScaleButton className="items-center justify-center" style={{ width: ms(64) }} onPress={() => setShowProfile(true)}>
          <View className={`rounded-full items-center justify-center mb-[2px] ${showProfile ? 'bg-pink-50' : 'bg-gray-50'}`} style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="person-outline" size={ms(24)} color={showProfile ? '#FF1493' : '#888'} />
          </View>
          <Text className={`${showProfile ? 'text-[#FF1493]' : 'text-[#888]'} font-bold`} style={{ fontSize: ms(10) }}>
            Profile
          </Text>
        </ScaleButton>
      </View>
    </View>
  );
}
