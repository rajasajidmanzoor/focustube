import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { seedDefaultChannelsIfNeeded, useSettingsStore } from '@/store';
import { Colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    void useSettingsStore.getState().hydrate();
    void seedDefaultChannelsIfNeeded();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="video/[videoId]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
      </Stack>
    </>
  );
}
