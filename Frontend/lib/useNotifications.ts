import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const useNotifications = (isAuthenticated: boolean) => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    checkPermissionAndRegister();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [isAuthenticated]);

  const checkPermissionAndRegister = async () => {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        if (isAuthenticated) saveTokenToBackend(token);
        Alert.alert('Push Token', token); // Force it to show so you can copy it!
      }
    } else if (existingStatus === 'undetermined') {
      // Show custom prompt first
      setShowPrompt(true);
    }
  };

  const handleEnableNotifications = async () => {
    setShowPrompt(false);
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      if (isAuthenticated) saveTokenToBackend(token);
      Alert.alert('Push Token', token);
    }
  };

  const saveTokenToBackend = async (token: string) => {
    try {
      await api.post('/notifications/register-token', {
        expo_push_token: token,
        device_type: Platform.OS,
      });
      console.log('Push token saved to backend');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  return { 
    expoPushToken, 
    showPrompt, 
    setShowPrompt, 
    handleEnableNotifications 
  };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }
    
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;

    try {
      const expoTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      token = expoTokenResponse.data;
    } catch (e: any) {
      console.error('Error getting push token', e);
    }
  }

  return token;
}
