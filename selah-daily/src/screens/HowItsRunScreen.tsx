/**
 * Settings → "How this app is run". A static page: where the money goes and the four
 * things that will not change. No donation language, no legal-sounding claims.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { howItsRun } from '../copy';
import { colors, radius, space, type } from '../theme';

export default function HowItsRunScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={type.h1}>{howItsRun.title}</Text>

      {howItsRun.facts.map(([head, detail]) => (
        <View key={head} style={styles.fact}>
          <Text style={styles.factHead}>{head}</Text>
          <Text style={type.small}>{detail}</Text>
        </View>
      ))}

      <Text style={[type.body, { marginTop: space.md }]}>{howItsRun.useOfMoney}</Text>

      <View style={styles.pledge}>
        <Text style={styles.pledgeTitle}>{howItsRun.pledgeTitle}</Text>
        {howItsRun.pledge.map((line, i) => (
          <View key={i} style={styles.pledgeRow}>
            <Text style={styles.bullet}>{i + 1}</Text>
            <Text style={[type.body, { flex: 1 }]}>{line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.sm, backgroundColor: colors.bg, flexGrow: 1 },
  fact: { marginTop: space.md, borderLeftWidth: 3, borderLeftColor: colors.amber, paddingLeft: space.sm },
  factHead: { ...type.h2, marginBottom: 2 },
  pledge: {
    marginTop: space.lg,
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
  },
  pledgeTitle: { ...type.h2, marginBottom: space.xs },
  pledgeRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.navy,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
