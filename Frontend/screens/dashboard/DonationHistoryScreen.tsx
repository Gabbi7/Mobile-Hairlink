import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import api from '../../lib/api';

const shadows = {
  header: {
    shadowColor: '#FF1493',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  recordCard: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2,
  },
};

interface DonationRecord {
  id: string;
  type: 'hair' | 'monetary';
  amount: number;
  status: string;
  created_at: string;
}

// Reusable animated button for consistency
const ScaleButton = ({ children, onPress, style }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
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

export default function DonationHistoryScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const insets = useSafeAreaInsets();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/donations');
      setDonations(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusStyle = (status: string, type: string) => {
    const s = status.toLowerCase();
    const isHair = type === 'hair';

    switch (s) {
      case 'approved': 
      case 'completed':
      case 'received hair':
      case 'wig received':
      case 'verified':
      case 'received':
        return { 
          bg: '#E8F5E9', 
          text: '#2E7D32', 
          label: 'Approved' 
        };
      case 'pending': 
      case 'submitted':
        return { bg: '#FFF3E0', text: '#EF6C00', label: 'Pending' };
      case 'rejected': return { bg: '#FFEBEE', text: '#C62828', label: 'Rejected' };
      default: return { bg: '#F5F5F5', text: '#757575', label: status };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View className="flex-1 bg-[#F8F0F5]">
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FF66B2', '#FF1493']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[30px]"
        style={[{ paddingTop: insets.top }, shadows.header]}
      >
        <View className="flex-row items-center justify-between px-[10px] py-[15px]">
          <TouchableOpacity onPress={onBack} className="items-center justify-center" style={{ width: ms(44), height: ms(44) }}>
            <Ionicons name="chevron-back" size={ms(28)} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-black tracking-[0.5px]" style={{ fontSize: ms(20) }}>Donation History</Text>
          <View style={{ width: ms(44) }} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ padding: ms(20), paddingBottom: Math.max(vs(40), insets.bottom + vs(20)), flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF66B2" />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF1493" className="mt-[50px]" />
        ) : donations.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-[100px]">
            <MaterialCommunityIcons name="heart-multiple-outline" size={ms(80)} color="#FFD6EF" />
            <Text className="text-primary font-black mt-[20px]" style={{ fontSize: ms(20) }}>No Donations Yet</Text>
            <Text className="text-[#999] text-center px-[40px] mt-[10px] leading-[20px]" style={{ fontSize: ms(14) }}>Your kindness will show up here as soon as you make your first donation!</Text>
          </View>
        ) : (
          <>
            <View 
              className="bg-[#FFF0F8] rounded-[15px] p-[12px] flex-row items-center mb-[20px] border border-[#FFD6EF]"
            >
              <Ionicons name="information-circle" size={ms(18)} color="#FF66B2" />
              <Text className="flex-1 ml-[10px] text-[#666] leading-[18px]" style={{ fontSize: ms(12) }}>
                <Text className="font-black">Note:</Text> Star Points are awarded once your donation status changes from <Text className="text-[#EF6C00] font-bold">Pending</Text> to <Text className="text-[#2E7D32] font-bold">Approved</Text>.
              </Text>
            </View>

            {donations.map((item, idx) => {
              const status = getStatusStyle(item.status, item.type);
              return (
                <Animated.View 
                  key={item.id} 
                  entering={FadeInUp.delay(idx * 100).springify()}
                  className="bg-white rounded-[20px] mb-[15px] p-[16px] border border-[#FFF0F8]"
                  style={shadows.recordCard}
                >
                   <View className="flex-row items-center">
                     <View 
                      className={`items-center justify-center mr-[15px] ${item.type === 'hair' ? 'bg-[#FFF0F8]' : 'bg-[#E3F2FD]'}`}
                      style={{ width: ms(52), height: ms(52), borderRadius: ms(18) }}
                     >
                        {item.type === 'hair' ? (
                          <MaterialCommunityIcons name="content-cut" size={ms(26)} color="#FF1493" />
                        ) : (
                          <FontAwesome5 name="wallet" size={ms(20)} color="#1976D2" />
                        )}
                     </View>
                     
                     <View className="flex-1">
                        <Text className="text-[#1a1a1a] font-extrabold mb-[2px]" style={{ fontSize: ms(16) }}>
                          {item.type === 'hair' ? 'Hair Donation' : 'Monetary Support'}
                        </Text>
                        <Text className="text-[#999] font-semibold" style={{ fontSize: ms(12) }}>{formatDate(item.created_at)}</Text>
                     </View>
  
                     <View className="items-end">
                        {item.type === 'monetary' && (
                          <Text className="text-[#1a1a1a] font-black mb-[6px]" style={{ fontSize: ms(16) }}>₱{item.amount}</Text>
                        )}
                        <View className="px-[10px] py-[4px] rounded-[10px]" style={[{ backgroundColor: status.bg }]}>
                          <Text className="font-black uppercase" style={[{ fontSize: ms(11), color: status.text }]}>
                            {status.label.toUpperCase()}
                          </Text>
                        </View>
                     </View>
                  </View>
                   
                   {item.type === 'hair' && item.status.toLowerCase() === 'approved' && (
                     <View className="mt-[16px] pt-[16px] border-t border-[#f0f0f0]">
                        <View className="flex-row items-center mb-[8px]">
                          <Ionicons name="location" size={ms(16)} color="#FF1493" />
                          <Text className="text-primary font-black ml-[6px] uppercase tracking-[0.5px]" style={{ fontSize: ms(14) }}>Delivery Instructions</Text>
                        </View>
                        <Text className="text-[#444] font-semibold mb-[8px] leading-[18px]" style={{ fontSize: ms(13) }}>
                          Deliver your hair to our Strand Up for Cancer Receiving Area:
                        </Text>
                        <View className="bg-[#FFF0F8] p-[12px] rounded-[12px] border border-[#FFD6EF] mb-[8px]">
                          <Text className="text-primary font-black leading-[18px] text-center" style={{ fontSize: ms(13) }}>
                            Manila Downtown YMCA (945 Sabino Padilla St., Sta. Cruz, Manila)
                          </Text>
                        </View>
                        <Text className="text-[#888] italic font-semibold" style={{ fontSize: ms(11) }}>
                          Please present your Reference ID: <Text className="font-black">{item.id}</Text> upon delivery.
                        </Text>
                     </View>
                   )}
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}



