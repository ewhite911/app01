import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/ui';
import { addPrayer, deletePrayer, listPrayers, markAnswered, Prayer } from '../db';
import { colors, config, radius, space, type } from '../theme';
import { useSub } from '../subContext';

export default function PrayersScreen({ navigation }: any) {
  const [items, setItems] = useState<Prayer[]>([]);
  const [text, setText] = useState('');
  const { active } = useSub();

  const reload = () => setItems(listPrayers());
  useFocusEffect(useCallback(reload, []));

  const activeCount = items.filter((p) => !p.answered_at).length;
  const atLimit = !active && activeCount >= config.freePrayerLimit;

  const add = () => {
    if (!text.trim()) return;
    if (atLimit) {
      navigation.navigate('Paywall');
      return;
    }
    addPrayer(text);
    setText('');
    reload();
  };

  const onLongPress = (p: Prayer) => {
    Alert.alert(p.text, undefined, [
      { text: p.answered_at ? 'Mark as not answered' : 'Mark as answered', onPress: () => { markAnswered(p.id, !p.answered_at); reload(); } },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePrayer(p.id); reload(); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={type.h1}>My prayers</Text>
      <Text style={type.small}>
        {active ? 'Member · unlimited requests, answered history kept' : `${activeCount} of ${config.freePrayerLimit} free requests`}
      </Text>
      <View style={styles.addRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a prayer request"
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Button title="Add" onPress={add} style={{ paddingVertical: 12 }} />
      </View>
      {atLimit && (
        <Pressable onPress={() => navigation.navigate('Paywall')}>
          <Text style={styles.limit}>
            The free list of {config.freePrayerLimit} is full. Members get unlimited requests · {config.priceLabel}.
          </Text>
        </Pressable>
      )}
      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: space.xl }}
        ListEmptyComponent={<Text style={[type.small, { marginTop: space.lg }]}>Nothing yet. Add the first thing on your heart.</Text>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => onLongPress(item)} onPress={() => { markAnswered(item.id, !item.answered_at); reload(); }} style={styles.item}>
            <View style={[styles.dot, item.answered_at && styles.dotOn]} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, item.answered_at && styles.done]}>{item.text}</Text>
              <Text style={type.small}>
                {item.answered_at
                  ? `Answered · ${new Date(item.answered_at).toLocaleDateString()}`
                  : `Prayed ${item.prayed_count} time${item.prayed_count === 1 ? '' : 's'} · since ${new Date(item.created_at).toLocaleDateString()}`}
              </Text>
            </View>
            {item.answered_at ? <Text style={styles.badge}>ANSWERED</Text> : null}
          </Pressable>
        )}
      />
      <Text style={styles.foot}>Tap to mark answered · hold for more</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.lg, backgroundColor: colors.bg, gap: space.sm },
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.sm },
  input: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.white },
  limit: { color: colors.navy, fontWeight: '600', marginVertical: space.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.navy },
  dotOn: { backgroundColor: colors.green, borderColor: colors.green },
  done: { textDecorationLine: 'line-through', color: colors.muted },
  badge: { color: colors.green, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  foot: { ...type.small, textAlign: 'center' },
});
