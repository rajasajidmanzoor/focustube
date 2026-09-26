import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, FontSizes, type ThemeColor } from '@/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'heading' | 'subtitle' | 'caption' | 'captionBold' | 'link' | 'code';
  color?: ThemeColor;
};

export function ThemedText({ style, type = 'default', color, ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        { color: Colors[color ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'heading' && styles.heading,
        type === 'subtitle' && styles.subtitle,
        type === 'caption' && styles.caption,
        type === 'captionBold' && styles.captionBold,
        type === 'link' && styles.link,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: FontSizes.body,
    lineHeight: 22,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: FontSizes.heading,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  caption: {
    fontSize: FontSizes.caption,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
    lineHeight: 16,
  },
  link: {
    fontSize: FontSizes.body,
    lineHeight: 22,
    color: Colors.accent,
  },
  code: {
    fontFamily: Fonts?.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: FontSizes.caption,
  },
});
