import { View, type ViewProps } from 'react-native';

import { Colors, type ThemeColor } from '@/theme';

export type ThemedViewProps = ViewProps & {
  color?: ThemeColor;
};

export function ThemedView({ style, color, ...otherProps }: ThemedViewProps) {
  return <View style={[{ backgroundColor: Colors[color ?? 'background'] }, style]} {...otherProps} />;
}
