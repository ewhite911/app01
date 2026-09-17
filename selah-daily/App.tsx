import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { initDb } from './src/db';
import { initPurchases } from './src/purchases';
import { SubProvider } from './src/subContext';
import TodayScreen from './src/screens/TodayScreen';
import PrayersScreen from './src/screens/PrayersScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ThankYouScreen from './src/screens/ThankYouScreen';
import HowItsRunScreen from './src/screens/HowItsRunScreen';
import { colors } from './src/theme';

initDb();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>
            {route.name === 'Today' ? '☀' : route.name === 'Prayers' ? '♡' : '⚙'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Prayers" component={PrayersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.navy } };

export default function App() {
  useEffect(() => {
    initPurchases().catch(() => {});
  }, []);
  return (
    <SubProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal', title: '' , headerShadowVisible: false }} />
          <Stack.Screen name="ThankYou" component={ThankYouScreen} options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="HowItsRun" component={HowItsRunScreen} options={{ title: '', headerShadowVisible: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SubProvider>
  );
}
