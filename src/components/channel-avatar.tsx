import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { Colors } from '@/theme';

type Props = { uri: string; size?: number };

export function ChannelAvatar({ uri, size = 36 }: Props) {
  return (
    <Image
      source={{ uri }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit="cover"
      transition={200}
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.surfaceElevated,
  },
});
