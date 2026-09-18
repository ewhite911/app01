import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, Linking, ScrollView, StyleSheet, Text, View, Vibration, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Scrim } from '../components/ui';
import { activePrayers, answeredPrayers, bumpPrayed, markRoutineDone, routineDoneToday, Prayer, routineCount, memberSince } from '../db';
import { verseForToday } from '../verses';
import { purchaseMode } from '../purchases';
import { Tree } from '../components/Tree';
import { useSub } from '../subContext';
import { pray } from '../copy';
import { colors, config, radius, space, type } from '../theme';

type Step = 'verse' | 'pray' | 'amen';
/** One minute per part. The three parts are the three minutes. */
const PHASE_SECONDS = 60;
const TIMER_SECONDS = PHASE_SECONDS * pray.phases.length;

// IMAGE SLOT: verse card backgrounds (see docs/이미지_프롬프트_실사감.md #01 and #02)
const verseMorningBg = require('../../assets/images/verse_morning.jpg');
const verseEveningBg = require('../../assets/images/verse_evening.jpg');
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
  // Evening card after 18:00 and before 05:00. In a test build the card can be
  // long-pressed to flip between the two, so the photographs can be reviewed
  // without waiting for the clock. The override is absent from a store build.
  const [override, setOverride] = useState<boolean | null>(null);
  const hour = new Date().getHours();
  const evening = override ?? (hour >= 18 || hour < 5);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [answered, setAnswered] = useState<Prayer[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPhase = useRef(0);

  const elapsed = TIMER_SECONDS - seconds;
  const started = running || seconds < TIMER_SECONDS;
  const phaseIndex = Math.min(Math.max(Math.floor(elapsed / PHASE_SECONDS), 0), pray.phases.length - 1);
  const phase = pray.phases[phaseIndex];

  // A short buzz when a part hands over, so the phone can stay face down.
  useEffect(() => {
    if (!started) {
      lastPhase.current = 0;
      return;
    }
    if (phaseIndex !== lastPhase.current) {
      lastPhase.current = phaseIndex;
      Vibration.vibrate(40);
    }
  }, [phaseIndex, started]);

  useFocusEffect(
    useCallback(() => {
      setDone(routineDoneToday());
      setPrayers(activePrayers());
      setAnswered(answeredPrayers());
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
        <Pressable
          onLongPress={purchaseMode === 'mock' ? () => setOverride(!evening) : undefined}
          delayLongPress={400}
        >
        <ImageBackground
          source={evening ? verseEveningBg : verseMorningBg}
          style={styles.card}
          imageStyle={styles.cardImg}
        >
          <View style={styles.veil} />
          <Scrim heightRatio={0.55} max={0.7} />
          <Text style={styles.ref}>{verse.ref} · BSB</Text>
          <Text style={type.verse}>“{verse.text}”</Text>
        </ImageBackground>
        </Pressable>
        <Text style={styles.hint}>
          {purchaseMode === 'mock'
            ? `Read it slowly. Once is enough.  [test: hold the card to see the ${evening ? 'morning' : 'evening'} image]`
            : 'Read it slowly. Once is enough.'}
        </Text>
        <Button title={done ? 'Pray again' : "I've read it"} onPress={() => setStep('pray')} variant="amber" />
        <View style={styles.treeCard}>
          <Tree count={count} size={150} isMember={active} memberSince={since} detail="name" />
        </View>
      </ScrollView>
    );
  }

  if (step === 'pray') {
    // The timer and the buttons live outside the scroll view. A long prayer
    // list used to push Amen off the bottom of the screen, which put the one
    // button the whole routine ends on somewhere you had to go looking for.
    return (
      <View style={[styles.prayRoot, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.md }]}>
        <Text style={styles.eyebrow}>{pray.eyebrow}</Text>

        {!started ? (
          <>
            <ScrollView contentContainerStyle={styles.prayScroll}>
            <View style={styles.intro}>
              <Text style={type.h2}>{pray.introTitle}</Text>
              {pray.phases.map((ph, i) => (
                <View key={ph.key} style={styles.introRow}>
                  <Text style={styles.introNum}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>{ph.title}</Text>
                    <Text style={type.small}>{ph.line}</Text>
                  </View>
                </View>
              ))}
              <Text style={[type.small, styles.introNote]}>{pray.introNote}</Text>
            </View>
            </ScrollView>
            <View style={styles.prayFoot}>
              <Button title={pray.start} onPress={() => setRunning(true)} />
              <View style={{ height: space.sm }} />
              <Button title={pray.skip} onPress={finishPrayer} variant="ghost" />
            </View>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.prayScroll}>
            <View style={styles.dots}>
              {pray.phases.map((ph, i) => (
                <View key={ph.key} style={[styles.dot, i === phaseIndex && styles.dotNow, i < phaseIndex && styles.dotPast]} />
              ))}
            </View>

            <Text style={styles.phaseTitle}>{phase.title}</Text>
            <Text style={styles.phaseLine}>{phase.line}</Text>

            {phase.key === 'still' && (
              <View style={styles.still}>
                <Text style={styles.stillQuote}>{phase.quote}</Text>
                <Text style={styles.stillRef}>{phase.ref} · BSB</Text>
              </View>
            )}

            {phase.key === 'people' &&
              (prayers.length === 0 ? (
                <Text style={[type.small, { textAlign: 'center', marginTop: space.md }]}>{phase.empty}</Text>
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
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      style={styles.check}
                    >
                      <View style={[styles.box, on && styles.boxOn]} />
                      <Text style={[type.body, { flex: 1 }]}>{p.text}</Text>
                    </Pressable>
                  );
                })
              ))}

            {phase.key === 'thanks' &&
              (answered.length === 0 ? (
                <Text style={[type.small, { textAlign: 'center', marginTop: space.md }]}>{phase.empty}</Text>
              ) : (
                <View style={styles.thanks}>
                  <Text style={styles.thanksHead}>{pray.answered}</Text>
                  {answered.map((p) => (
                    <View key={p.id} style={styles.thanksRow}>
                      <Text style={styles.thanksMark}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={type.body}>{p.text}</Text>
                        <Text style={type.small}>{new Date(p.answered_at!).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}

            </ScrollView>
            <View style={styles.prayFoot}>
              <Text style={styles.timer}>{mm}:{ss}</Text>
              <Text style={styles.hint}>{seconds <= 0 ? pray.over : pray.quiet}</Text>
              <View style={{ height: space.md }} />
              {seconds > 0 && (
                <Button title={running ? pray.pause : pray.resume} onPress={() => setRunning(!running)} variant="ghost" />
              )}
              <View style={{ height: space.sm }} />
              <Button title={pray.amen} onPress={finishPrayer} variant="amber" />
            </View>
          </>
        )}
      </View>
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
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, flexGrow: 1 },
  prayRoot: { flex: 1, paddingHorizontal: space.lg, backgroundColor: colors.bg },
  prayScroll: { paddingBottom: space.md, flexGrow: 1 },
  prayFoot: { paddingTop: space.sm },
  treeCard: { alignItems: 'center', marginTop: 'auto', paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  eyebrow: { fontSize: 12, letterSpacing: 1.5, fontWeight: '700', color: colors.muted },
  card: { borderRadius: radius.lg, overflow: 'hidden', padding: space.lg, minHeight: 340, justifyContent: 'flex-end' },
  cardImg: { borderRadius: radius.lg },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,26,44,0.12)' },
  ref: { color: colors.amber, fontWeight: '700', fontSize: 12, letterSpacing: 1, marginBottom: space.sm },
  hint: { ...type.small, textAlign: 'center' },
  timer: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: colors.muted, fontVariant: ['tabular-nums'] },

  // Before the timer starts: the three minutes, named in advance.
  intro: { backgroundColor: colors.soft, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  introNum: {
    width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24,
    backgroundColor: colors.navy, color: colors.white, fontSize: 13, fontWeight: '700', overflow: 'hidden',
  },
  introNote: { marginTop: space.xs },

  // Which minute is running. Three dots, no numbers, nothing to read.
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginTop: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotPast: { backgroundColor: colors.navy, opacity: 0.35 },
  dotNow: { backgroundColor: colors.navy, width: 26 },

  phaseTitle: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: colors.ink, marginTop: space.md },
  phaseLine: { ...type.small, textAlign: 'center', lineHeight: 20, paddingHorizontal: space.md },

  still: { alignItems: 'center', marginTop: space.xl, paddingHorizontal: space.md },
  thanks: { marginTop: space.lg, backgroundColor: colors.soft, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  thanksHead: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.muted },
  thanksRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  thanksMark: { color: colors.green, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  stillQuote: { ...type.verse, color: colors.ink, textAlign: 'center' },
  stillRef: { color: colors.muted, fontSize: 12, letterSpacing: 1, marginTop: space.sm },
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
