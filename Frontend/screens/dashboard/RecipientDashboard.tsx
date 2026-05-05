import React, { useState, useEffect } from 'react';
import ProfileScreen from './ProfileScreen';
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import api from '../../lib/api';
import MonetaryDonationDashboard from './MonetaryDonationDashboard';
import RecipientCalendarScreen from './RecipientCalendarScreen';
import NotificationScreen from './NotificationScreen';
import HairRequestScreen from './HairRequestScreen';

interface RecipientDashboardProps {
  onLogout?: () => void;
  onRoleChange?: (role: 'Donor' | 'Recipient') => void;
  userName?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const shadows = {
  header: {
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 8,
  },
  hero: {
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCTA: {
    shadowColor: '#9B59B6',
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
  bottomNav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
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

export default function RecipientDashboard({ onLogout, onRoleChange, userName = "Recipient" }: RecipientDashboardProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonetary, setShowMonetary] = useState(false);
  const [showHairRequest, setShowHairRequest] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [starPoints, setStarPoints] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const notificationsViewedRef = React.useRef(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 30, secs: 45 });

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log('Error fetching unread count:', err);
    }
  }, []);

  const fetchLatestRequest = React.useCallback(async () => {
    try {
      // Assuming we have an endpoint for latest request or it's in /me
      const response = await api.get('/me');
      if (response.data && response.data.latest_hair_request) {
        setLatestRequest(response.data.latest_hair_request);
      } else {
        // Fallback or specific endpoint if needed
        // For now, let's just use the /me response if it's there
        setLatestRequest(null);
      }
    } catch (err) {
      console.log('Error fetching latest request:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchLatestRequest();
  }, [fetchUnreadCount, fetchLatestRequest]);

  useEffect(() => {
    // Re-fetch counts whenever the dashboard is the active view
    if (!showCalendar && !showNotifications && !showMonetary && !showProfile && !showHairRequest) {
      fetchUnreadCount();
      fetchLatestRequest();
      notificationsViewedRef.current = false; // Reset ref so it can be used again if needed
    }
  }, [showCalendar, showNotifications, showMonetary, showProfile, showHairRequest, fetchUnreadCount, fetchLatestRequest]);

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

  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(err => Alert.alert('Error', 'Cannot open link'));
  };

  const navPlaceholder = (screen: string) =>
    Alert.alert('Coming Soon', `${screen} is coming soon!`);

  if (showNotifications) {
    return (
      <View style={{ flex: 1 }}>
        <NotificationScreen onBack={() => setShowNotifications(false)} role="Recipient" />
      </View>
    );
  }

  if (showMonetary) {
    return (
      <View style={{ flex: 1 }}>
        <MonetaryDonationDashboard
          onBack={() => setShowMonetary(false)}
          role="Recipient"
          onSuccess={() => {
            setShowMonetary(false);
            setShowNotifications(true);
          }}
        />
      </View>
    );
  }

  if (showProfile) {
    return (
      <View style={{ flex: 1 }}>
        <ProfileScreen
          onBack={() => setShowProfile(false)}
          onLogout={onLogout!}
          onRoleChange={onRoleChange}
        />
      </View>
    );
  }

  if (showHairRequest) {
    return (
      <View style={{ flex: 1 }}>
        <HairRequestScreen
          onBack={() => setShowHairRequest(false)}
          onSuccess={() => {
            setShowHairRequest(false);
            setShowNotifications(true);
          }}
        />
      </View>
    );
  }

  if (showCalendar) {
    return (
      <View style={{ flex: 1 }}>
        <RecipientCalendarScreen onBack={() => setShowCalendar(false)} />
      </View>
    );
  }

  if (showAR) {
    return (
      <Animated.View
        style={{ flex: 1 }}
        entering={FadeInUp.springify().damping(15).stiffness(120)}
        exiting={FadeOut.duration(200)}
      >
        <ARScreen onBack={() => setShowAR(false)} />
      </Animated.View>
    );
  }

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F9F4FC]" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <Animated.View entering={FadeIn.duration(400)}>
        <LinearGradient
          colors={['#8E44AD', '#9B59B6']}
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
            colors={['#F5EEF8', '#E8DAEF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[22px]"
            style={[shadows.hero]}
          >
            <View style={{ padding: ms(22) }}>
              <Text className="font-black text-[#1a1a1a] mb-[6px]" style={{ fontSize: ms(26), lineHeight: vs(32) }}>
                STRAND UP{`\n`}FOR CANCER
              </Text>
              <Text className="text-[#9B59B6] font-bold mb-[18px]" style={{ fontSize: ms(13) }}>
                Hope begins, one strand at a time
              </Text>
              <ScaleButton
                className="self-start bg-[#8E44AD] rounded-full shadow-md"
                style={[{ paddingHorizontal: ms(26), paddingVertical: vs(12) }, shadows.heroCTA]}
                onPress={() => setShowMonetary(true)}
              >
                <Text className="text-white font-black" style={{ fontSize: ms(15) }}>Donate Now →</Text>
              </ScaleButton>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Status Tracker ────────────────────────── */}
        <Animated.View 
          entering={FadeInRight.springify().delay(200)} 
          className="bg-white mx-[14px] mb-[14px] rounded-[20px]"
          style={[{ padding: ms(18) }, shadows.card]}
        >
          <View className="flex-row items-center mb-[14px]">
            <Ionicons name="time-outline" size={20} color="#9B59B6" />
            <Text className="font-extrabold text-[#9B59B6] flex-1" style={{ fontSize: ms(16) }}>  My Request Status</Text>
          </View>

          {/* Steps */}
          {!latestRequest ? (
            <View className="items-center py-[10px]">
              <Text className="text-[#aaa] italic">No active requests. Start your journey below! ✨</Text>
            </View>
          ) : (
            [
              { label: 'Application Submitted', done: true },
              { label: 'Under Review', done: latestRequest.status !== 'pending' },
              { label: 'Hair Matched', done: ['matched', 'ready'].includes(latestRequest.status) },
              { label: 'Wig Ready for Pickup', done: latestRequest.status === 'ready' },
            ].map((step, i) => (
              <View key={i} className="flex-row items-center mb-[12px]">
                <View 
                  className={`w-[22px] h-[22px] rounded-full border-[2px] items-center justify-center mr-[12px] ${step.done ? 'bg-[#9B59B6] border-[#9B59B6]' : 'border-[#E8DAEF]'}`}
                >
                  {step.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text className={`font-semibold ${step.done ? 'text-[#1a1a1a]' : 'text-[#888]'}`} style={{ fontSize: ms(14) }}>
                  {step.label}
                </Text>
              </View>
            ))
          )}
        </Animated.View>

        {/* ── How It Works ──────────────────────────── */}
        <Animated.View 
          entering={FadeInDown.springify().delay(300)} 
          className="bg-white mx-[14px] mb-[14px] rounded-[20px]"
          style={[{ padding: ms(18) }, shadows.card]}
        >
          <Text className="font-black text-[#1a1a1a] text-center mb-[4px]" style={{ fontSize: ms(18) }}>How It Works</Text>
          <Text className="text-[#888] text-center mb-[18px]" style={{ fontSize: ms(12), lineHeight: vs(18) }}>
            Apply for a wig or support our mission — we make the process simple.
          </Text>

          <View className="flex-row">
            {/* Request Hair */}
            <View className="flex-1 border-[1.5px] border-[#E8DAEF] rounded-[18px] items-center mx-[4px] bg-purple-50/50" style={{ padding: ms(14) }}>
              <View className="bg-purple-100 justify-center items-center mb-[10px]" style={{ width: ms(54), height: ms(54), borderRadius: ms(27) }}>
                <Ionicons name="ribbon-outline" size={28} color="#9B59B6" />
              </View>
              <Text className="font-black text-[#1a1a1a] mb-[6px] text-center" style={{ fontSize: ms(15) }}>Request Hair</Text>
              <Text className="text-[#888] text-center mb-[14px] flex-1" style={{ fontSize: ms(11), lineHeight: vs(16) }}>
                Apply for a free wig with health certification.
              </Text>
              <ScaleButton
                className="bg-purple-500 rounded-[16px] self-stretch items-center"
                style={{ paddingHorizontal: ms(20), paddingVertical: vs(8) }}
                onPress={() => setShowHairRequest(true)}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: ms(13) }}>Apply</Text>
              </ScaleButton>
            </View>

            {/* Monetary Donation */}
            <View className="flex-1 border-[1.5px] border-[#E8DAEF] rounded-[18px] items-center mx-[4px] bg-purple-50/50" style={{ padding: ms(14) }}>
              <View className="bg-purple-100 justify-center items-center mb-[10px]" style={{ width: ms(54), height: ms(54), borderRadius: ms(27) }}>
                <Ionicons name="cash-outline" size={28} color="#9B59B6" />
              </View>
              <Text className="font-black text-[#1a1a1a] mb-[6px] text-center" style={{ fontSize: ms(15) }}>Donation</Text>
              <Text className="text-[#888] text-center mb-[14px] flex-1" style={{ fontSize: ms(11), lineHeight: vs(16) }}>
                Support our mission with a contribution.
              </Text>
              <ScaleButton
                className="bg-purple-500 rounded-[16px] self-stretch items-center"
                style={{ paddingHorizontal: ms(20), paddingVertical: vs(8) }}
                onPress={() => setShowMonetary(true)}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: ms(13) }}>Donate</Text>
              </ScaleButton>
            </View>
          </View>
        </Animated.View>


        {/* ── About Us ───────────────────────────────── */}
        <Animated.View 
          entering={FadeInUp.springify().delay(400)} 
          className="mx-[14px] mb-[24px] rounded-[18px] overflow-hidden bg-purple-50"
          style={{ elevation: 3 }}
        >
          <Image 
            source={require('../../assets/group.jpg')} 
            className="w-full" 
            style={{ height: vs(250) }}
            resizeMode="cover"
          />
          <View className="items-center mt-[20px] mb-[30px]" style={{ paddingHorizontal: ms(20) }}>
            <View className="flex-row items-center justify-center mb-[12px]">
              <Text className="font-black text-[#1a1a1a] mr-[8px]" style={{ fontSize: ms(26) }}>About Us</Text>
              <MaterialCommunityIcons 
                name="ribbon" 
                size={32} 
                color="#9B59B6" 
                style={{ transform: [{ rotate: '15deg' }] }}
              />
            </View>
            <Text className="text-[#333] text-center font-medium" style={{ fontSize: ms(14), lineHeight: vs(22) }}>
              Strand Up for Cancer (SUFC) is a youth-led initiative of the Manila Downtown YMCA Youth Club dedicated to supporting patients who experience long-term hair loss caused by illness and medical treatment. Through hair donations, we craft wigs that restore not only appearance but also a sense of dignity, comfort, and renewed self-confidence. Each strand given is more than just hair—it’s a gift of hope and strength.
            </Text>
          </View>
        </Animated.View>

        {/* ── Our Partners ───────────────────────────── */}
        <Animated.View entering={FadeInRight.springify().delay(500)} className="mb-[30px]">
          <Text className="font-black text-[#1a1a1a] text-center mb-[4px]" style={{ fontSize: ms(18) }}>Our Partners</Text>
          <View className="flex-row justify-around px-[10px] mt-[14px]">
            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#E8DAEF]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.card]}
              onPress={() => handleOpenURL('https://web.facebook.com/ManilaDowntownYMCAYouthClub')}
            >
              <View className="bg-[#F5EEF8] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/ymca.jpg')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>YMCA Youth Club</Text>
            </ScaleButton>

            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#E8DAEF]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.card]}
              onPress={() => handleOpenURL('https://web.facebook.com/Richarddmanilawigmaker')}
            >
              <View className="bg-[#F5EEF8] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/RDM.png')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>Richard D. Manila</Text>
            </ScaleButton>

            <ScaleButton
              className="bg-white rounded-[16px] items-center justify-center border border-[#E8DAEF]"
              style={[{ padding: ms(10), width: ms(105) }, shadows.card]}
              onPress={() => handleOpenURL('https://pgh.gov.ph/')}
            >
              <View className="bg-[#F5EEF8] items-center justify-center mb-[8px] overflow-hidden" style={{ width: ms(58), height: ms(58), borderRadius: ms(29) }}>
                <Image source={require('../../assets/pgh_logo.png')} className="w-[75%] h-[75%]" resizeMode="contain" />
              </View>
              <Text className="font-bold text-[#666] text-center" style={{ fontSize: ms(10) }}>PGH Hospital</Text>
            </ScaleButton>
          </View>
        </Animated.View>

        {/* ── Upcoming Events ────────────────────────── */}
        <Animated.View entering={FadeInUp.springify().delay(600)} className="mx-[14px] mb-[30px]">
          <TouchableOpacity activeOpacity={0.9} onPress={() => setShowCalendar(true)}>
            <LinearGradient
              colors={['#9B59B6', '#8E44AD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-[32px] border-2 border-white/10"
              style={[{ padding: ms(22) }, shadows.hero]}
            >
              <View className="flex-row justify-between items-center mb-[10px]">
                <Text className="font-black text-white/80 tracking-[1.5px]" style={{ fontSize: ms(11) }}>UPCOMING EVENT</Text>
                <Ionicons name="calendar" size={20} color="#fff" />
              </View>
              <Text className="font-black text-white mb-[4px]" style={{ fontSize: ms(22) }}>Annual Grand Hair Drive</Text>
              <Text className="text-white/90 font-semibold mb-[20px]" style={{ fontSize: ms(12) }}>Manila Downtown YMCA Auditorium</Text>

              <View className="flex-row items-center justify-center bg-black/15 rounded-[24px]" style={{ paddingVertical: vs(12) }}>
                {['DAYS', 'HOURS', 'MINS', 'SECS'].map((unit, idx) => {
                  const val = unit === 'DAYS' ? timeLeft.days :
                    unit === 'HOURS' ? timeLeft.hours :
                      unit === 'MINS' ? timeLeft.mins : timeLeft.secs;
                  return (
                    <React.Fragment key={unit}>
                      <View className="items-center" style={{ width: ms(60) }}>
                        <Text className="font-black text-white" style={{ fontSize: ms(22) }}>{val}</Text>
                        <Text className="font-extrabold text-white/70 mt-[2px]" style={{ fontSize: ms(9) }}>{unit}</Text>
                      </View>
                      {idx < 3 && <Text className="text-white font-black mx-[4px]" style={{ fontSize: ms(22), marginTop: vs(-10) }}>:</Text>}
                    </React.Fragment>
                  )
                })}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Nav ────────────────────────────── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white flex-row items-start justify-around border-t border-[#E8DAEF]/40 shadow-2xl"
        style={[{ height: vs(68) + insets.bottom, paddingHorizontal: ms(8), paddingTop: vs(8) }, shadows.bottomNav]}
      >
        <ScaleButton className="items-center justify-center" style={{ width: ms(64) }} onPress={() => { }}>
          <View className="bg-gray-50 rounded-full items-center justify-center mb-[2px]" style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="home" size={ms(24)} color="#9B59B6" />
          </View>
          <Text className="text-[#9B59B6] font-black" style={{ fontSize: ms(10) }}>Home</Text>
        </ScaleButton>

        <ScaleButton className="items-center justify-center" style={{ width: ms(64) }} onPress={() => setShowCalendar(true)}>
          <View className="bg-gray-50 rounded-full items-center justify-center mb-[2px]" style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="calendar-outline" size={ms(24)} color="#888" />
          </View>
          <Text className="text-[#888] font-bold" style={{ fontSize: ms(10) }}>Schedule</Text>
        </ScaleButton>

        <ScaleButton
          className="bg-[#9B59B6] items-center justify-center border-[4px] border-white shadow-2xl"
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
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={ms(26)} color="#888" />
              {unreadCount > 0 && (
                <View
                  className="absolute bg-[#9B59B6] justify-center items-center border-2 border-white"
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
          <View className={`rounded-full items-center justify-center mb-[2px] ${showProfile ? 'bg-purple-50' : 'bg-gray-50'}`} style={{ width: ms(40), height: ms(40) }}>
            <Ionicons name="person-outline" size={ms(24)} color={showProfile ? '#9B59B6' : '#888'} />
          </View>
          <Text className={`${showProfile ? 'text-[#9B59B6]' : 'text-[#888]'} font-bold`} style={{ fontSize: ms(10) }}>
            Profile
          </Text>
        </ScaleButton>
      </View>
    </View>
  );
}
 