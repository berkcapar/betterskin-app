import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, AppState } from 'react-native';

// Screens
import OnboardingScreen from '@/screens/OnboardingScreen';
import HomeScreen from '@/screens/HomeScreen';
import CameraScreen from '@/screens/CameraScreen';
import ResultScreen from '@/screens/ResultScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import UpgradeScreen from '@/screens/UpgradeScreen';

// Services
import { storage } from '@/lib/storage';
import { iap } from '@/lib/iap';
import { database } from '@/lib/database';

// Types
import { RootStackParamList } from '@/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    
    // Handle app state changes for IAP restoration
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        iap.restorePurchases().catch(console.error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize core services
      await Promise.all([
        database.init(),
        iap.initialize(),
      ]);

      // Check onboarding status
      const onboardingComplete = await storage.isOnboardingComplete();
      setIsOnboardingComplete(onboardingComplete);
      
      setIsLoading(false);
    } catch (error) {
      console.error('App initialization failed:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart the application.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    await storage.setOnboardingComplete();
    setIsOnboardingComplete(true);
  };

  if (isLoading || isOnboardingComplete === null) {
    // You could show a loading screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName={isOnboardingComplete ? 'Home' : 'Onboarding'}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#333333',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          {!isOnboardingComplete && (
            <Stack.Screen
              name="Onboarding"
              options={{ headerShown: false }}
            >
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={handleOnboardingComplete}
                />
              )}
            </Stack.Screen>
          )}
          
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Face Analysis',
              headerLargeTitle: true,
            }}
          />
          
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{
              title: 'Take Photo',
              headerBackTitle: 'Cancel',
            }}
          />
          
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{
              title: 'Analysis Results',
              headerBackTitle: 'Home',
            }}
          />
          
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: 'Analysis History',
              headerBackTitle: 'Home',
            }}
          />
          
          <Stack.Screen
            name="Upgrade"
            component={UpgradeScreen}
            options={{
              title: 'Upgrade to Premium',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 