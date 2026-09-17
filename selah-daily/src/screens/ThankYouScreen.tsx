/**
 * Shown once, right after membership starts. One full screen, no upsell, no confetti.
 * Deliberately plain: it thanks the member for paying, it does not tell them they
 * "gave the app life" or anything else the app cannot stand behind.
 */
import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { Tree } from '../components/Tree';
import { memberSince, routineCount } from '../db';
import { thankYou } from '../copy';
import { colors, space } from '../theme';

// IMAGE SLOT: amen background (see docs/이미지_가이드_및_프롬프트.md)
const bg = require('../../assets/images/amen.jpg');

export default function ThankYouScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const since = memberSince() ?? new Date();

  return (
    <ImageBackground source={bg} style={styles.bg}>
      <View style={styles.veil} />
      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg },
        ]}
      >
        <Text style={styles.title}>{thankYou.title}</Text>
        <Text style={styles.body}>{thankYou.body}</Text>
        <View style={{ height: space.lg }} />
        <Tree count={routineCount()} size={140} tone="dark" isMember memberSince={since} showCaption={false} />
        <View style={styles.plaque}>
          <Text style={styles.plaqueText}>Member since {since.toLocaleDateString()}</Text>
        </View>
        <View style={{ height: space.xl }} />
        <Button
          title={thankYou.back}
          variant="amber"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
        />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,12,30,0.62)' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: space.lg },
  title: { fontSize: 40, fontWeight: '700', fontStyle: 'italic', color: colors.white, textAlign: 'center' },
  body: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.white,
    opacity: 0.92,
    textAlign: 'center',
    marginTop: space.md,
  },
  plaque: {
    alignSelf: 'center',
    marginTop: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  plaqueText: { color: colors.white, opacity: 0.9, fontSize: 12, letterSpacing: 0.3 },
});
