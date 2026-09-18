import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, View, Vibration, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Scrim } from '../components/ui';
import { activePrayers, bumpPrayed, markRoutineDone, routineDoneToday, Prayer, routineCount, memberSince } from '../db';
import { verseForToday } from '../verses';
import { Tree } from '../components/Tree';
import { useSub } from '../subContext';
import { colors, config, radius, space, type } from '../theme';

type Step = 'verse' | 'pray' | 'amen';
const TIMER_SECONDS = 180;

// IMAGE SLOT: morning verse background (see docs/이미지_가이드_및_프롬프트.md → "오늘 화면 말씀 카드 배경")
const verseBg = require('../../assets/images/verse_morning.jpg');
// IMAGE SLOT: amen background
const amenBg = require('../../assets/images/amen.jpg');

export default function TodayScreen({ navigation }: any) {
  const verse = verseForToday();
  const { active } = useSub();
  const insets = useSafeAreaInsets();
  const since = memberSince();
  const [step, setStep] = useState<Step>('verse');
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setDone(routineDoneToday());
      setPrayers(activePrayers());
      setCount(routineCount());
    }, [])
  );

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (seconds <= 0 && running) {
      setRunning(false);
      Vibration.vibrate([0, 200, 100, 200]);
    }
  }, [seconds, running]);

  const finishPrayer = () => {
    setRunning(false);
    bumpPrayed([...checked]);
    markRoutineDone();
    setDone(true);
    const n = routineCount();
    setCount(n); // the tree grows the moment the routine is finished
    setStep('amen');
    // After the 3rd completed routine, show the paywall once (never on first launch).
    if (n === 3) navigation.navigate('Paywall', { fromRoutine: true });
  };

  const openYouTube = async () => {
    const url = `https://www.youtube.com/playlist?list=${config.youtubePlaylistId}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) return Alert.alert('Could not open YouTube', 'Please install the YouTube app or open the link in a browser.');
    Linking.openURL(url); // Universal/App Link → YouTube app, web fallback if not installed
  };

  const mm = String(Math.floor(Math.max(seconds, 0) / 60)).padStart(1, '0');
  const ss = String(Math.max(seconds, 0) % 60).padStart(2, '0');

  if (step === 'verse') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + space.lg }]}>
        <Text style={styles.eyebrow}>{done ? 'TODAY · DONE' : 'TODAY'}</Text>
        <ImageBackground source={verseBg} style={styles.card} imageStyle={styles.cardImg}>
          <View style={styles.veil} />
          <Scrim />
          <Text style={styles.ref}>{verse.ref} · BSB</Text>
          <Text style={type.verse}>“{verse.text}”</Text>
        </ImageBackground>
        <Text style={styles.hint}>Read it slowly. Once is enough.</Text>
        <Button title={done ? 'Pray again' : "I've read it"} onPress={() => setStep('pray')} variant="amber" />
        <View style={styles.treeCard}>
          <Tree count={count} size={128} isMember={active} memberSince={since} />
        </View>
      </ScrollView>
    );
  }

  if (step === 'pray') {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + space.lg }]}>
        <Text style={styles.eyebrow}>PRAY</Text>
        <Text style={styles.timer}>{mm}:{ss}</Text>
        <Text style={styles.hint}>Vibration only. Nothing leaves your phone.</Text>
        <View style={{ height: space.md }} />
        {prayers.length === 0 ? (
          <Text style={[type.small, { textAlign: 'center' }]}>
            No prayer requests yet. Add some in the Prayers tab, or just pray.
          </Text>
        ) : (
          prayers.map((p) => {
            const on = checked.has(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  const next = new Set(checked);
                  on ? next.delete(p.id) : next.add(p.id);
                  setChecked(next);
                }}
                style={styles.check}
              >
                <View style={[styles.box, on && styles.boxOn]} />
                <Text style={[type.body, { flex: 1 }]}>{p.text}</Text>
              </Pressable>
            );
          })
        )}
        <View style={{ height: space.lg }} />
        {!running && seconds === TIMER_SECONDS ? (
          <Button title="Start 3 minutes" onPress={() => setRunning(true)} />
        ) : (
          <Button title={running ? 'Pause' : 'Resume'} onPress={() => setRunning(!running)} variant="ghost" />
        )}
        <View style={{ height: space.sm }} />
        <Button title="Amen" onPress={finishPrayer} variant="amber" />
      </ScrollView>
    );
  }

  return (
    <ImageBackground source={amenBg} style={styles.amenBg}>
      <View style={styles.amenVeil} />
      <ScrollView
        contentContainerStyle={[
          styles.amenInner,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg },
        ]}
      >
        <Text style={styles.amen}>Amen.</Text>
        <Text style={styles.amenSub}>
          {checked.size} prayer{checked.size === 1 ? '' : 's'} · {Math.round((TIMER_SECONDS - Math.max(seconds, 0)) / 60)} min
        </Text>
        <View style={{ height: space.lg }} />
        <Tree count={count} size={150} tone="dark" isMember={active} memberSince={since} />
        <View style={{ height: space.lg }} />
        <Button title="▶  Close with worship on YouTube" onPress={openYouTube} variant="yt" />
        <Text style={styles.amenNote}>Opens the YouTube app. Music plays there, not here.</Text>
        <View style={{ height: space.sm }} />
        <Button
          title="Done for today"
          variant="ghost"
          onPress={() => {
            setStep('verse');
            setSeconds(TIMER_SECONDS);
            setChecked(new Set());
          }}
        />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg },
  treeCard: { alignItems: 'center', paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  eyebrow: { fontSize: 12, letterSpacing: 1.5, fontWeight: '700', color: colors.muted },
  card: { borderRadius: radius.lg, overflow: 'hidden', padding: space.lg, minHeight: 240, justifyContent: 'flex-end' },
  cardImg: { borderRadius: radius.lg },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,26,44,0.25)' },
  ref: { color: colors.amber, fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: space.sm },
  hint: { ...type.small, textAlign: 'center' },
  timer: { fontSize: 64, fontWeight: '800', textAlign: 'center', color: colors.navy, fontVariant: ['tabular-nums'] },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.navy },
  boxOn: { backgroundColor: colors.navy },
  amenBg: { flex: 1 },
  amenVeil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,12,30,0.55)' },
  amenInner: { flexGrow: 1, justifyContent: 'center', padding: space.lg },
  amen: { fontSize: 48, fontStyle: 'italic', fontWeight: '600', color: colors.white, textAlign: 'center' },
  amenSub: { color: colors.white, opacity: 0.85, textAlign: 'center', marginTop: space.sm },
  amenNote: { color: colors.white, opacity: 0.8, fontSize: 12, textAlign: 'center', marginTop: space.xs },
});
