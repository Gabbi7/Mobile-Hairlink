import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from '../../lib/scaling';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../lib/api';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  Layout, 
  useAnimatedStyle, 
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';

const shadows = {
  header: {
    shadowColor: '#9B59B6',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  card: {
    shadowColor: '#9B59B6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconCircle: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  whiteCard: {
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 20, 
    elevation: 4,
    shadowOffset: { width: 0, height: 5 },
  },
  eventCard: {
    shadowColor: '#9B59B6', 
    shadowOpacity: 0.25, 
    shadowRadius: 12, 
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  statusBadge: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
};

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  location: string;
  time: string;
  date: string; // YYYY-MM-DD
  type: 'drive' | 'meeting' | 'other';
  accepted?: boolean;
  status?: string;
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
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 10, stiffness: 200 }))}
        onPressOut={() => (scale.value = withSpring(1))}
        className="w-full h-full items-center justify-center"
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RecipientCalendarScreen({ onBack }: { onBack?: () => void }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [showMonthView, setShowMonthView] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // ── Fetch Donations ──────────────────────────
  React.useEffect(() => {
    fetchDonations();
  }, [viewDate]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Fetch both donations and hair requests simultaneously using API
      const [donationsRes, requestsRes] = await Promise.all([
        api.get('/donations'),
        api.get('/hair-requests')
      ]);

      const donationsData = donationsRes.data || [];
      const requestsData = requestsRes.data || [];

      // Map donations to Events
      const mappedDonations: Event[] = donationsData.map((d: any) => ({
        id: d.id,
        title: d.type === 'hair' ? 'Hair Donation' : `Monetary Support (₱${d.amount})`,
        location: d.type === 'hair' ? 'Manila Downtown YMCA (945 Sabino Padilla St., Sta. Cruz, Manila)' : 'Financial Aid',
        time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: d.created_at.split('T')[0],
        type: d.type === 'hair' ? 'drive' : 'other', 
        accepted: ['approved', 'completed', 'received hair'].includes(d.status.toLowerCase()),
        status: d.status
      }));

      // Map hair requests to Events
      const mappedRequests: Event[] = requestsData.map((h: any) => ({
        id: h.id,
        title: 'Hair Request',
        location: 'Medical Review',
        time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: h.created_at.split('T')[0],
        type: 'drive',
        accepted: h.status.toLowerCase() === 'approved' || h.status.toLowerCase() === 'matched',
        status: h.status
      }));

      setEvents([...mappedDonations, ...mappedRequests]);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Dynamic Date Helpers ─────────────────────
  
  const monthName = useMemo(() => {
    return viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewDate]);

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: '', full: `pad-${i}`, isPadding: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const full = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        days.push({ date: i.toString(), full, isPadding: false });
    }
    return days;
  }, [viewDate]);

  const weekDays = useMemo(() => {
    const sel = new Date(selectedDate);
    const startOfWeek = new Date(sel);
    startOfWeek.setDate(sel.getDate() - sel.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return {
            day: dayNames[i],
            date: d.getDate().toString(),
            full: d.toISOString().split('T')[0]
        };
    });
  }, [selectedDate]);

  const dailyEvents = events.filter((e) => e.date === selectedDate);

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const handleAccept = (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, accepted: true } : e));
    setShowAcceptedModal(true);
  };

  const getDayNameLong = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('default', { weekday: 'long' });
  };

  return (
    <View className="flex-1 bg-[#F9F4FC]">
      <StatusBar style="light" />
      
      {/* ── Premium Purple Gradient Header ────────────────── */}
      <LinearGradient
        colors={['#8E44AD', '#9B59B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[30px]"
        style={[{ paddingHorizontal: ms(16), paddingBottom: vs(24), paddingTop: insets.top }, shadows.header]}
      >
        <View className="flex-row items-center justify-between w-full mb-[20px] mt-[10px]">
          <TouchableOpacity onPress={onBack} className="items-center justify-center" style={{ width: ms(44), height: ms(44) }}>
            <Ionicons name="chevron-back" size={ms(28)} color="#fff" />
          </TouchableOpacity>
            
            <View className="flex-1 flex-row items-center justify-center px-[4px]">
              <Text className="text-white font-black mr-[10px] uppercase tracking-[0.5px]" style={{ fontSize: ms(20) }}>{monthName}</Text>
              
              <View className="flex-row items-center bg-white/15 rounded-full px-[4px]">
                <TouchableOpacity onPress={() => changeMonth(-1)} className="p-[6px] items-center justify-center">
                  <Ionicons name="chevron-back-circle-outline" size={ms(26)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeMonth(1)} className="p-[6px] items-center justify-center">
                  <Ionicons name="chevron-forward-circle-outline" size={ms(26)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row items-center justify-end" style={{ width: ms(44) }}>
              <ScaleButton 
                className="bg-white rounded-[14px]" 
                style={[{ width: ms(42), height: ms(42) }, shadows.iconCircle]}
                onPress={() => setShowMonthView(!showMonthView)}
              >
                <Ionicons 
                  name={showMonthView ? "list-sharp" : "calendar-sharp"} 
                  size={ms(22)} 
                  color={"#9B59B6"} 
                />
              </ScaleButton>
          </View>
        </View>

        <Animated.View layout={Layout.springify()}>
            {showMonthView ? (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} className="flex-row flex-wrap justify-start px-0 mt-[10px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <Text key={i} className="text-white/70 font-black text-center mb-[15px] tracking-[1px]" style={{ width: '14.28%', fontSize: ms(13) }}>{d}</Text>
                ))}
                {monthDays.map((m, idx) => (
                  <ScaleButton 
                    key={`${m.full}-${idx}`} 
                    className={`rounded-[14px] mb-[6px] ${selectedDate === m.full ? 'bg-white' : ''}`}
                    style={[{ width: '14.28%', height: vs(48), opacity: m.isPadding ? 0 : 1 }, selectedDate === m.full && shadows.card]}
                    onPress={() => !m.isPadding && setSelectedDate(m.full)}
                  >
                    <Text className={`font-black ${selectedDate === m.full ? 'text-purple-500' : 'text-white'}`} style={{ fontSize: ms(16) }}>
                      {m.date}
                    </Text>
                    {!m.isPadding && events.some(e => e.date === m.full) && <View className="w-[5px] h-[5px] rounded-full bg-[#AF7AC5] absolute bottom-[6px]" />}
                  </ScaleButton>
                ))}
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} className="flex-row justify-around px-[4px] mt-[10px]">
                {weekDays.map((w) => (
                  <ScaleButton 
                    key={w.full} 
                    className={`items-center rounded-[24px] ${selectedDate === w.full ? 'bg-white' : ''}`}
                    style={[{ width: '13%', height: vs(72), paddingVertical: vs(14) }, selectedDate === w.full && shadows.card]}
                    onPress={() => setSelectedDate(w.full)}
                  >
                    <Text className={`font-extrabold mb-[6px] tracking-[0.5px] ${selectedDate === w.full ? 'text-purple-500' : 'text-white/80'}`} style={{ fontSize: ms(13) }}>{w.day}</Text>
                    <Text className={`font-black ${selectedDate === w.full ? 'text-purple-500' : 'text-white'}`} style={{ fontSize: ms(20) }}>{w.date}</Text>
                  </ScaleButton>
                ))}
              </Animated.View>
            )}
          </Animated.View>
      </LinearGradient>

      <View className="flex-1 bg-[#F9F4FC] mt-[-10px]">
        <View 
          className="flex-1 bg-white rounded-[35px] mx-[16px] mb-[20px] mt-[10px]"
          style={[{ padding: ms(28) }, shadows.whiteCard]}
        >
          <View className="flex-row items-center mb-[35px]">
            <Text className="font-black text-[#1a1a1a] tracking-[-0.5px]" style={{ fontSize: ms(26) }}>{getDayNameLong(selectedDate)} {selectedDate.split('-')[2]}</Text>
            {selectedDate === today.toISOString().split('T')[0] && (
              <View className="ml-[15px] bg-purple-50 px-[14px] py-[8px] rounded-[12px]">
                 <Text className="text-purple-500 font-black uppercase tracking-[0.5px]" style={{ fontSize: ms(14) }}>Today</Text>
              </View>
            )}
            <View className="flex-1 h-[1.5px] bg-[#f0f0f0] ml-[15px]" />
          </View>

          {dailyEvents.length > 0 ? (
            <FlatList
              data={dailyEvents}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                    <Animated.View entering={FadeInDown.springify()} className="flex-row mb-[30px]">
                      <View className="items-start" style={{ width: ms(70), paddingTop: vs(8) }}>
                        <Text className="text-[#1a1a1a] font-black tracking-[-0.5px]" style={{ fontSize: ms(15) }}>{item.time.split(' ')[0]}</Text>
                        <Text className="text-[#bbb] font-extrabold uppercase mt-[-2px]" style={{ fontSize: ms(10) }}>{item.time.split(' ')[1]}</Text>
                      </View>
                      
                      <LinearGradient
                        colors={['#9B59B6', '#8E44AD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="flex-1 rounded-[26px] flex-row items-center"
                        style={[{ padding: ms(20) }, shadows.eventCard]}
                      >
                    <View 
                      className="bg-white rounded-[18px] items-center justify-center mr-[18px]"
                      style={{ width: ms(54), height: ms(54) }}
                    >
                      {item.title.includes('Hair') ? (
                        <MaterialCommunityIcons name="heart-pulse" size={ms(24)} color="#9B59B6" />
                      ) : (
                        <MaterialCommunityIcons name="cash-multiple" size={ms(24)} color="#9B59B6" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black mb-[4px] tracking-[0.2px]" style={{ fontSize: ms(18) }}>{item.title}</Text>
                      <Text className="text-white/90 font-bold mb-[14px]" style={{ fontSize: ms(13) }}>{item.location}</Text>
                      
                      {item.status && (
                        <View 
                          className="self-start rounded-[12px] mt-[10px]"
                          style={[{ paddingHorizontal: ms(14), paddingVertical: vs(6), backgroundColor: item.status === 'approved' ? '#27AE60' : '#F39C12' }, shadows.statusBadge]}
                        >
                          <Text className="text-white font-black uppercase tracking-[0.5px]" style={{ fontSize: ms(12) }}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                      </LinearGradient>
                    </Animated.View>
              )}
            />
          ) : (
            <View className="flex-1 justify-center items-center pb-[60px]">
              <MaterialCommunityIcons name="calendar-blank" size={ms(60)} color="#E8DAEF" />
              <Text className="text-[#bbb] font-extrabold mt-[20px] text-center" style={{ fontSize: ms(18) }}>No requests or aid for this date.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal visible={showAcceptedModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center">
          <Animated.View entering={SlideInUp} className="bg-[#1a1a1a] rounded-[35px] items-center" style={[{ padding: ms(35), width: '85%' }, shadows.modal]}>
            <View className="bg-purple-500 rounded-full items-center justify-center mb-[25px]" style={{ width: ms(90), height: ms(90) }}>
              <Ionicons name="checkmark-done" size={ms(40)} color="#fff" />
            </View>
            <Text className="text-white font-black mb-[12px] tracking-[0.2px]" style={{ fontSize: ms(24) }}>Request Updated</Text>
            <Text className="text-[#999] text-center mb-[35px] font-semibold" style={{ fontSize: ms(16), lineHeight: vs(24) }}>Your application status has been refreshed.</Text>
            <TouchableOpacity className="border-t border-[#333] w-full items-center" style={{ paddingTop: vs(25) }} onPress={() => setShowAcceptedModal(false)}>
              <Text className="text-white font-black uppercase tracking-[1px]" style={{ fontSize: ms(18) }}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

