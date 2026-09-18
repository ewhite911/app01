import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../components/ui';
import { claimTransfer, createTransfer, format, isComplete, normalize, TransferError } from '../transfer';
import { transfer } from '../copy';
import { colors, config, radius, space, type } from '../theme';

type Mode = 'pick' | 'send' | 'receive';

export default function TransferScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>('pick');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [entry, setEntry] = useState('');

  const send = async () => {
    setBusy(true);
    try {
      const { code: c, count } = await createTransfer();
      setCode(c);
      setMode('send');
      if (count === 0) Alert.alert(transfer.emptyTitle, transfer.emptyBody);
    } catch {
      Alert.alert(transfer.failTitle, transfer.networkBody);
    } finally {
      setBusy(false);
    }
  };

  const receive = async () => {
    setBusy(true);
    try {
      const { prayers, days } = await claimTransfer(entry);
      Alert.alert(transfer.doneTitle, transfer.doneBody(prayers, days), [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const kind = e instanceof TransferError ? e.kind : 'network';
      Alert.alert(
        transfer.failTitle,
        kind === 'not-found' ? transfer.notFoundBody : kind === 'bad-code' ? transfer.badCodeBody : transfer.networkBody
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>{transfer.title}</Text>
        <Text style={[type.small, styles.lede]}>{transfer.lede}</Text>

        {mode === 'pick' && (
          <View style={styles.block}>
            <Pressable onPress={send} disabled={busy} style={styles.choice}>
              <Text style={type.h2}>{transfer.sendTitle}</Text>
              <Text style={[type.small, styles.choiceBody]}>{transfer.sendBody}</Text>
            </Pressable>
            <Pressable onPress={() => setMode('receive')} disabled={busy} style={styles.choice}>
              <Text style={type.h2}>{transfer.receiveTitle}</Text>
              <Text style={[type.small, styles.choiceBody]}>{transfer.receiveBody}</Text>
            </Pressable>
            {busy && <ActivityIndicator style={{ marginTop: space.lg }} color={colors.navy} />}
          </View>
        )}

        {mode === 'send' && (
          <View style={styles.block}>
            <View style={styles.codeBox}>
              <Text style={styles.code} accessibilityLabel={normalize(code).split('').join(' ')} selectable>
                {code}
              </Text>
            </View>
            <Text style={[type.small, styles.hint]}>{transfer.sendHint(config.transferHours)}</Text>
            <Button
              title="Copy the code"
              variant="ghost"
              onPress={() => {
                Clipboard.setStringAsync(code);
                Alert.alert('Copied', transfer.copied);
              }}
              style={{ marginTop: space.md }}
            />
            <Button title="Done" onPress={() => navigation.goBack()} style={{ marginTop: space.sm }} />
          </View>
        )}

        {mode === 'receive' && (
          <View style={styles.block}>
            <TextInput
              value={entry}
              onChangeText={(t) => setEntry(format(normalize(t)))}
              placeholder="XXXX-XXXX-XX"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              maxLength={12}
              accessibilityLabel={transfer.entryLabel}
              style={styles.input}
            />
            <Text style={[type.small, styles.hint]}>{transfer.receiveHint}</Text>
            <Button
              title={busy ? 'Bringing them over…' : 'Bring my prayers over'}
              onPress={receive}
              disabled={busy || !isComplete(entry)}
              style={{ marginTop: space.md }}
            />
            <Button title="Back" variant="ghost" onPress={() => setMode('pick')} style={{ marginTop: space.sm }} />
          </View>
        )}

        <Text style={[type.small, styles.foot]}>{transfer.privacy(config.transferHours)}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, backgroundColor: colors.bg, flexGrow: 1 },
  lede: { marginTop: space.sm, lineHeight: 20 },
  block: { marginTop: space.lg },
  choice: {
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
  },
  choiceBody: { marginTop: space.xs, lineHeight: 20 },
  codeBox: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  code: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    fontSize: 24,
    letterSpacing: 2,
    textAlign: 'center',
    color: colors.ink,
    backgroundColor: colors.white,
  },
  hint: { marginTop: space.sm, lineHeight: 20 },
  foot: { marginTop: 'auto', paddingTop: space.lg, lineHeight: 20 },
});
