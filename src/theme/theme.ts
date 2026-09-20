import { Platform } from 'react-native';

import { tokens } from './tokens.generated';

// FocusTube ships dark-only (V1 "Dark UI" requirement) — a single palette, no
// light/dark switching.
export const Colors = {
  background: tokens.colorBackground,
  surface: tokens.colorSurface,
  surfaceElevated: tokens.colorSurfaceElevated,
  border: tokens.colorBorder,
  selected: tokens.colorSelected,

  text: tokens.colorText,
  textSecondary: tokens.colorTextSecondary,
  textDisabled: tokens.colorTextDisabled,

  accent: tokens.colorAccent,
  accentPressed: tokens.colorAccentPressed,

  success: tokens.colorSuccess,
  error: tokens.colorError,

  overlay: tokens.colorOverlay,
} as const;

export type ThemeColor = keyof typeof Colors;

export const Spacing = {
  half: tokens.spacingHalf,
  one: tokens.spacingOne,
  two: tokens.spacingTwo,
  three: tokens.spacingThree,
  four: tokens.spacingFour,
  five: tokens.spacingFive,
  six: tokens.spacingSix,
} as const;

export const Radii = {
  small: tokens.radiusSmall,
  medium: tokens.radiusMedium,
  large: tokens.radiusLarge,
  pill: tokens.radiusPill,
} as const;

export const FontSizes = {
  caption: tokens.fontSizeCaption,
  body: tokens.fontSizeBody,
  subtitle: tokens.fontSizeSubtitle,
  title: tokens.fontSizeTitle,
  heading: tokens.fontSizeHeading,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
