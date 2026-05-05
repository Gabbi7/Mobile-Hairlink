import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface NotificationPromptProps {
  visible: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

export default function NotificationPrompt({ visible, onAllow, onDecline }: NotificationPromptProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          entering={FadeInDown.springify().damping(15)} 
          style={styles.modalContainer}
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* Status Icon Header */}
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={42} color="#F472B6" />
            </View>

            <Text style={styles.titleText}>Stay Connected</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <Text style={styles.emoji}>🎀</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.boldText}>Impact Alerts:</Text> Know exactly when your donation makes a difference.
                </Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.emoji}>✨</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.boldText}>Wig Updates:</Text> Get notified the moment your custom wig is ready.
                </Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.emoji}>⭐</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.boldText}>Rewards:</Text> Stay updated on your Star Points and special milestones.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.allowBtn} 
              onPress={onAllow}
              activeOpacity={0.8}
            >
              <Text style={styles.allowBtnText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.declineBtn} 
              onPress={onDecline}
              activeOpacity={0.6}
            >
              <Text style={styles.declineBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE7F3', // Light pink background
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -40,
    borderWidth: 4,
    borderColor: '#fff',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 10,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#333',
  },
  allowBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F472B6', // Pink color matching HairLink theme
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  allowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  declineBtn: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
});
