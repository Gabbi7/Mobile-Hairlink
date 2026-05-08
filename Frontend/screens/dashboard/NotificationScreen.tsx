import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';

const shadows = {
  header: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8,
  },
  searchBar: {
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2,
  },
  activeTab: {
    elevation: 2,
  },
  notificationCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 3,
  },
};

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Reusable animated button for consistency
const ScaleButton = ({ children, onPress, style, className }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} className={className}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1))}
        className="w-full"
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationScreen({ onBack, onTrack, role = 'Donor' }: { onBack?: () => void, onTrack?: () => void, role?: 'Donor' | 'Recipient' }) {
  const isRecipient = role === 'Recipient';
  const themeColor = isRecipient ? '#9B59B6' : '#FF1493';
  const themeMedium = isRecipient ? '#8E44AD' : '#FF66B2';
  const themeLight = isRecipient ? '#E8DAEF' : '#FFB3D9';
  const themeBg = isRecipient ? '#F9F4FC' : '#F8F0F5';
  const themePale = isRecipient ? '#FFF0F8' : '#FFF0F5'; // Small adjustment for consistency
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all'); // Using existing path for now, but aliased ones are available
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  React.useEffect(() => {
    let subscription: any;

    const init = async () => {
      await fetchNotifications();
      await markAllAsRead(); // Auto-mark all as read when screen opens
      
      // Setup Supabase Realtime
      try {
        const meRes = await api.get('/me');
        const userId = meRes.data.id;
        
        subscription = supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => {
              setNotifications(prev => [payload.new as NotificationItem, ...prev]);
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up real-time notifications', err);
      }
    };
    init();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };


  const filteredNotifications = notifications.filter((n) => {
    const matchesTab = activeTab === 'All' || !n.is_read;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const groupedNotifications = filteredNotifications.reduce((acc: any, n) => {
    const group = getDateGroup(n.created_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const getNotifStyle = (type: string) => {
    if (isRecipient) {
      switch (type) {
        case 'wig':
        case 'hair_donation':
        case 'donation':
          return { icon: 'ribbon', color: '#8E44AD', bg: '#F5EEF8' };
        case 'monetary_donation':
          return { icon: 'wallet', color: '#9B59B6', bg: '#FDF7FF' };
        case 'announcement':
          return { icon: 'megaphone', color: '#8E44AD', bg: '#F5EEF8' };
        default:
          return { icon: 'mail', color: '#9B59B6', bg: '#FDF7FF' };
      }
    }
    
    switch (type) {
      case 'wig': return { icon: 'ribbon', color: '#8E44AD', bg: '#F3E5F5' };
      case 'hair_donation': return { icon: 'content-cut', color: '#D81B60', bg: '#FCE4EC' };
      case 'monetary_donation': return { icon: 'wallet', color: '#1E88E5', bg: '#E3F2FD' };
      case 'donation': return { icon: 'heart-pulse', color: '#FF1493', bg: '#FFF0F5' };
      case 'announcement': return { icon: 'megaphone', color: '#FB8C00', bg: '#FFF3E0' };
      default: return { icon: 'mail', color: themeMedium, bg: themePale };
    }
  };

  const renderIcon = (type: string) => {
    const style = getNotifStyle(type);
    return <MaterialCommunityIcons name={style.icon as any} size={26} color={style.color} />;
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: themeBg }}>
      <StatusBar style="light" />

      {/* ── Premium Gradient Header ────────────────── */}
      <LinearGradient
        colors={isRecipient ? [themeColor, themeMedium] : ['#FF66B2', '#FF1493']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[30px]"
        style={[{ shadowColor: isRecipient ? themeMedium : '#FF1493', paddingTop: insets.top }, shadows.header]}
      >
        <View className="flex-row items-center justify-between px-[10px] py-[15px]">
          <TouchableOpacity onPress={onBack} className="items-center justify-center" style={{ width: ms(44), height: ms(44) }}>
            <Ionicons name="chevron-back" size={ms(28)} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-black tracking-[0.5px]" style={{ fontSize: ms(20) }}>Notifications</Text>
          <View style={{ width: ms(44) }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: vs(40) }} showsVerticalScrollIndicator={false}>
        {/* ── Search Bar ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-[20px] pt-[24px] mb-[20px]">
          <View 
            className="flex-row items-center bg-white rounded-[20px] border-[1.5px] px-[16px] py-[12px]"
            style={[{ borderColor: themeLight }, shadows.searchBar]}
          >
            <Ionicons name="search-outline" size={20} color={themeMedium} />
            <TextInput
              placeholder="Search notifications..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-[10px] font-semibold text-[#333]"
              style={{ fontSize: ms(16) }}
            />
          </View>
        </Animated.View>

        {/* ── Filters ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200)} className="flex-row items-center justify-between px-[20px] mb-[10px]">
          <View className="flex-row">
            {['All', 'Unread'].map((tab: any) => {
              const count = notifications.filter(n => tab === 'All' ? true : !n.is_read).length;
              return (
                <TouchableOpacity
                  key={tab}
                  className={`flex-row items-center px-[14px] py-[8px] rounded-[15px] mr-[10px] border ${activeTab === tab ? 'bg-white' : ''}`}
                  style={[
                    { backgroundColor: activeTab === tab ? '#fff' : (isRecipient ? 'rgba(155,89,182,0.1)' : 'rgba(255,102,178,0.1)'), borderColor: activeTab === tab ? themeMedium : 'transparent' },
                    activeTab === tab && shadows.activeTab
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text className={`font-bold mr-[6px] ${activeTab === tab ? '' : 'text-[#666]'}`} style={[{ fontSize: ms(14) }, activeTab === tab && { color: themeColor }]}>{tab}</Text>
                  <View 
                    className={`rounded-[10px] px-[6px] py-[2px] items-center justify-center`}
                    style={[{ minWidth: ms(20), backgroundColor: activeTab === tab ? themeMedium : 'rgba(255,255,255,0.8)' }]}
                  >
                    <Text className={`font-extrabold ${activeTab === tab ? 'text-white' : 'text-[#888]'}`} style={{ fontSize: ms(11) }}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="font-bold" style={[{ fontSize: ms(13), color: themeColor }]}>Mark all as read</Text>
          </TouchableOpacity>
        </Animated.View>

        {loading && !refreshing && (
          <View className="mt-[100px]">
            <ActivityIndicator size="large" color={themeColor} />
          </View>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <View className="flex-1 items-center justify-center mt-[80px] px-[40px]">
            <Ionicons name="notifications-off-outline" size={80} color={themeLight} />
            <Text className="text-[#1a1a1a] font-black mt-[20px]" style={{ fontSize: ms(20) }}>Nothing here yet</Text>
            <Text className="text-[#999] text-center mt-[10px] font-semibold leading-[20px]" style={{ fontSize: ms(14) }}>
              {search ? "No results found for your search." : "You're all caught up! Check back later for updates."}
            </Text>
          </View>
        )}

        {Object.keys(groupedNotifications).map((group, gIdx) => (
          <Animated.View key={group} entering={FadeIn.delay(300 + gIdx * 100)}>
            <Text className="text-[#1a1a1a] font-black mx-[24px] mt-[24px] mb-[12px]" style={{ fontSize: ms(18) }}>{group}</Text>
            {groupedNotifications[group].map((n: NotificationItem) => {
              const style = getNotifStyle(n.type);
              const isExpanded = expandedId === n.id;
              
              return (
                <ScaleButton
                  key={n.id}
                  className="bg-white mx-[16px] mb-[16px] rounded-[20px] border-l-[6px] overflow-hidden"
                  style={[
                    { borderLeftColor: style.color, opacity: n.is_read ? 0.8 : 1 },
                    shadows.notificationCard
                  ]}
                  onPress={() => {
                    setExpandedId(isExpanded ? null : n.id);
                    if (!n.is_read) markAsRead(n.id);
                  }}
                >
                  <View className="flex-row p-[16px]">
                    <View 
                      className="rounded-[20px] items-center justify-center mr-[16px]"
                      style={{ width: ms(56), height: ms(56), backgroundColor: style.bg }}
                    >
                      {renderIcon(n.type)}
                    </View>
                    
                    <View className="flex-1 justify-center">
                      <View className="flex-row items-start justify-between mb-[4px]">
                        <Text 
                          className={`font-extrabold flex-1 pr-[10px] leading-[22px] ${n.is_read ? 'text-[#888] font-semibold' : 'text-[#1a1a1a]'}`}
                          style={{ fontSize: ms(17) }}
                        >
                          {n.title || 'Update Available'}
                        </Text>
                        {!n.is_read && <View className="w-[10px] h-[10px] rounded-full mt-[6px]" style={{ backgroundColor: themeMedium }} />}
                      </View>
                      
                      <Text 
                        className={`text-[#555] leading-[20px] font-medium ${isExpanded ? 'text-[#222] mt-[4px] mb-[12px] leading-[24px]' : ''}`} 
                        style={{ fontSize: isExpanded ? ms(16) : ms(14) }}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {n.message || 'Check your dashboard for the latest details on your activity.'}
                      </Text>

                      <View className="flex-row items-center justify-between mt-[10px]">
                        <View className="flex-row items-center gap-[4px]">
                          <Ionicons name="time-outline" size={12} color="#999" />
                          <Text className="text-[#999] font-bold" style={{ fontSize: ms(12) }}>{getRelativeTime(n.created_at)}</Text>
                        </View>
                        
                        {['donation', 'hair_donation', 'monetary_donation', 'wig'].includes(n.type) && onTrack && (
                          <TouchableOpacity
                            className="flex-row items-center px-[14px] py-[6px] rounded-[12px] border-[1.5px] gap-[6px]"
                            style={{ backgroundColor: themeBg, borderColor: themeLight }}
                            onPress={(e) => {
                              e.stopPropagation();
                              onTrack();
                            }}
                          >
                            <Text className="font-black tracking-[1px]" style={[{ fontSize: ms(12), color: themeColor }]}>TRACK</Text>
                            <Ionicons name="arrow-forward" size={12} color={themeColor} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </ScaleButton>
              );
            })}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}




