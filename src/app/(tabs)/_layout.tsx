import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useSettingsStore } from '@/store';
import { Colors } from '@/theme';

export default function TabsLayout() {
  const shortsEnabled = useSettingsStore((store) => store.shortsEnabled);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: 'Shorts',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} />,
          // Hides the tab (not just disables it) when the user turns Shorts off in
          // Settings, per the "Shorts enabled" setting's own description.
          href: shortsEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
