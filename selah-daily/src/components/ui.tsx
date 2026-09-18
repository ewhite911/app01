import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'amber' | 'ghost' | 'yt';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const bg =
    variant === 'amber' ? colors.amber : variant === 'ghost' ? colors.soft : variant === 'yt' ? colors.yt : colors.navy;
  const fg = variant === 'amber' ? colors.ink : variant === 'ghost' ? colors.navy : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
});

/**
 * A bottom-up dark scrim, so white text stays readable over a photo that has
 * bright areas low in the frame. Built from stacked translucent bands because
 * a real gradient would mean pulling in expo-linear-gradient for one effect.
 */
export function Scrim({ heightRatio = 0.6, max = 0.92, bands = 16 }: { heightRatio?: number; max?: number; bands?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${heightRatio * 100}%` }}
    >
      {Array.from({ length: bands }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            // eased so the top of the scrim is almost invisible and only the last bands are dark
            backgroundColor: `rgba(20,26,44,${(max * Math.pow((i + 1) / bands, 1.7)).toFixed(3)})`,
          }}
        />
      ))}
    </View>
  );
}
