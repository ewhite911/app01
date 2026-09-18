/**
 * The growing tree, Psalm 1 from end to end: a seed to a tree planted by water.
 *
 * Rules agreed in docs/결정사항_및_다음작업.md §2-7:
 *  - It grows with completed routines and NEVER wilts, dies or goes backwards.
 *  - Free users get the whole tree. Membership adds a sign and fruit — decoration only,
 *    no content, no ranking, no comparison with anyone else.
 *  - Drawn with plain views, so it needs no image files and no extra dependency.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../theme';
import { tree as treeCopy } from '../copy';

export type Stage = {
  key: 'seed' | 'sprout' | 'seedling' | 'young' | 'water';
  name: string;
  caption: string;
  /** Completed routines needed to reach this stage. */
  min: number;
};

export const STAGES: Stage[] = [
  // Not "a mustard seed": black mustard is an annual herb, and a mustard seed
  // cannot grow into the tree planted by water. One plant, one passage.
  { key: 'seed', name: 'A seed', caption: 'Small enough to lose in your hand.', min: 0 },
  { key: 'sprout', name: 'A sprout', caption: 'Something has broken through.', min: 3 },
  { key: 'seedling', name: 'A seedling', caption: 'Roots first, branches later.', min: 7 },
  { key: 'young', name: 'A young tree', caption: 'It holds its own weight now.', min: 14 },
  { key: 'water', name: 'A tree planted by water', caption: 'Its leaf does not wither. (Psalm 1)', min: 30 },
];

export function stageFor(count: number): { stage: Stage; index: number; next: Stage | null; toNext: number } {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) if (count >= STAGES[i].min) index = i;
  const next = index < STAGES.length - 1 ? STAGES[index + 1] : null;
  return { stage: STAGES[index], index, next, toNext: next ? next.min - count : 0 };
}

/**
 * The drawn plant below is the fallback. Where a plate exists it is used
 * instead: two-ink botanical drawings, all on one 1024 canvas with the ground
 * line at 82%, so the plant grows in place instead of jumping between stages.
 * `_dark` is the same plate with the navy ink lifted to the app's off-white,
 * for the screens that sit on a dark photograph.
 */
type Plate = { light: number; dark: number; lightFruit?: number; darkFruit?: number };
const PLATES: Record<Stage['key'], Plate | null> = {
  seed: { light: require('../../assets/tree/seed.png'), dark: require('../../assets/tree/seed_dark.png') },
  sprout: { light: require('../../assets/tree/sprout.png'), dark: require('../../assets/tree/sprout_dark.png') },
  seedling: { light: require('../../assets/tree/seedling.png'), dark: require('../../assets/tree/seedling_dark.png') },
  young: {
    light: require('../../assets/tree/young.png'),
    dark: require('../../assets/tree/young_dark.png'),
    lightFruit: require('../../assets/tree/young_fruit.png'),
    darkFruit: require('../../assets/tree/young_fruit_dark.png'),
  },
  // The tree planted by water is still drawn; its plates have not arrived.
  water: null,
};

/** Visible height of a plate, as a fraction of its square canvas. */
const PLATE_BOX: Record<Stage['key'], number> = {
  seed: 0.2, sprout: 0.34, seedling: 0.56, young: 0.84, water: 1,
};

const leaf = '#3E8E5A';
const leafDeep = '#2E6B46';
const stem = '#6B5A3E';
const bark = '#5A4A34';

/**
 * A single leaf. Two opposite corners fully rounded and the other two nearly
 * square gives the pointed-oval shape; the tilt keeps it from reading as a flag.
 */
function Leaf({ u, size, side, top }: { u: number; size: number; side: -1 | 1; top: number }) {
  const w = size * u;
  const h = w * 0.55;
  return (
    <View
      style={{
        position: 'absolute',
        top: top * u,
        left: side === 1 ? 49 * u : (51 - size) * u,
        width: w,
        height: h,
        backgroundColor: side === 1 ? leaf : leafDeep,
        borderTopLeftRadius: side === 1 ? h : h * 0.15,
        borderBottomRightRadius: side === 1 ? h : h * 0.15,
        borderTopRightRadius: side === 1 ? h * 0.15 : h,
        borderBottomLeftRadius: side === 1 ? h * 0.15 : h,
        transform: [{ rotate: side === 1 ? '-18deg' : '18deg' }],
      }}
    />
  );
}

function Canopy({ u, d, cx, top, tone }: { u: number; d: number; cx: number; top: number; tone: 'light' | 'dark' }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: d * u,
        height: d * u,
        borderRadius: (d * u) / 2,
        left: (cx - d / 2) * u,
        top: top * u,
        backgroundColor: tone === 'dark' ? leaf : leafDeep,
        opacity: tone === 'dark' ? 0.95 : 1,
      }}
    />
  );
}

export function Tree({
  count,
  size = 160,
  tone = 'light',
  isMember = false,
  memberSince = null,
  detail = 'full',
}: {
  count: number;
  size?: number;
  tone?: 'light' | 'dark';
  isMember?: boolean;
  memberSince?: Date | null;
  /**
   * 'name' is the daily path: the drawing and what it is, nothing else. The
   * whole app is three minutes, and a paragraph under the tree every morning
   * is three lines in the way of it — the "N more days" line especially, which
   * is the streak pressure this app does not do.
   * 'full' is for the moments someone arrives at once: Amen, and thank-you.
   */
  detail?: 'name' | 'full' | 'none';
}) {
  const { stage, index, next, toNext } = stageFor(count);
  const u = size / 100; // 100 × 100 drawing grid
  const fg = tone === 'dark' ? colors.white : colors.ink;
  const sub = tone === 'dark' ? 'rgba(255,255,255,0.85)' : colors.muted;
  const soil = tone === 'dark' ? 'rgba(255,255,255,0.22)' : colors.soft;
  /** Fruit appears from the young-tree stage, and only for members. */
  const fruit = isMember && index >= 3;

  /**
   * The grid is always 100 x 100, but early stages only use the bottom of it.
   * Cropping to the used part keeps a seed from reserving a screen of empty sky.
   */
  const plate = PLATES[stage.key];
  const boxHeight = size * (plate ? PLATE_BOX[stage.key] : [0.34, 0.46, 0.62, 0.86, 1][index]);
  const plateSource = plate
    ? tone === 'dark'
      ? (fruit && plate.darkFruit) || plate.dark
      : (fruit && plate.lightFruit) || plate.light
    : null;

  return (
    <View style={{ alignItems: 'center' }} accessibilityLabel={`${stage.name}. ${count} days completed.`}>
      <View style={{ width: size, height: boxHeight, overflow: 'hidden' }}>
        {plateSource ? (
          // The plate's ground line sits at 82% of its canvas; drop it so the
          // line lands just above the bottom of the visible box.
          <Image
            source={plateSource}
            style={{ position: 'absolute', left: 0, bottom: -size * 0.14, width: size, height: size }}
            resizeMode="contain"
          />
        ) : (
        <View style={{ position: 'absolute', left: 0, bottom: 0, width: size, height: size }}>
        {/* ground */}
        <View
          style={{
            position: 'absolute',
            left: 8 * u,
            right: 8 * u,
            top: 82 * u,
            height: 4 * u,
            borderRadius: 2 * u,
            backgroundColor: soil,
          }}
        />
        {/* water, final stage only */}
        {index >= 4 && (
          <View
            style={{
              position: 'absolute',
              left: 6 * u,
              right: 6 * u,
              top: 88 * u,
              height: 7 * u,
              borderRadius: 3.5 * u,
              backgroundColor: tone === 'dark' ? 'rgba(160,200,230,0.55)' : '#BBD5E8',
            }}
          />
        )}

        {index === 0 && (
          <View
            style={{
              position: 'absolute',
              width: 7 * u,
              height: 5 * u,
              borderRadius: 3.5 * u,
              left: 46.5 * u,
              top: 78 * u,
              backgroundColor: colors.amber,
            }}
          />
        )}

        {index >= 1 && (
          <View
            style={{
              position: 'absolute',
              left: 48.5 * u,
              width: 3.6 * u,
              top: (index >= 3 ? 44 : index === 2 ? 52 : 64) * u,
              bottom: 16 * u,
              borderRadius: 1.5 * u,
              backgroundColor: index >= 3 ? bark : stem,
            }}
          />
        )}

        {index === 1 && (
          <>
            <Leaf u={u} size={16} side={1} top={62} />
            <Leaf u={u} size={16} side={-1} top={68} />
          </>
        )}

        {index === 2 && (
          <>
            <Leaf u={u} size={20} side={1} top={50} />
            <Leaf u={u} size={20} side={-1} top={58} />
            <Leaf u={u} size={16} side={1} top={68} />
          </>
        )}

        {index === 3 && <Canopy u={u} d={44} cx={50} top={20} tone={tone} />}

        {index >= 4 && (
          <>
            <Canopy u={u} d={38} cx={36} top={26} tone={tone} />
            <Canopy u={u} d={38} cx={64} top={26} tone={tone} />
            <Canopy u={u} d={46} cx={50} top={12} tone={tone} />
          </>
        )}

        {fruit && (
          <>
            <View style={[styles.fruit, { width: 5 * u, height: 5 * u, borderRadius: 2.5 * u, left: 40 * u, top: (index >= 4 ? 40 : 44) * u }]} />
            <View style={[styles.fruit, { width: 5 * u, height: 5 * u, borderRadius: 2.5 * u, left: 58 * u, top: (index >= 4 ? 34 : 36) * u }]} />
          </>
        )}
        </View>
        )}
      </View>

      {detail !== 'none' && (
        <View style={{ alignItems: 'center', marginTop: space.sm, paddingHorizontal: space.md }}>
          <Text style={[styles.name, { color: fg }]}>{stage.name}</Text>
          {detail === 'full' && (
            <>
              <Text style={[styles.caption, { color: sub }]}>{stage.caption}</Text>
              <Text style={[styles.caption, { color: sub, marginTop: 2 }]}>
                {next ? `${toNext} more ${toNext === 1 ? 'day' : 'days'} to ${next.name.toLowerCase()}.` : treeCopy.connect}
              </Text>
            </>
          )}
          {isMember && memberSince && (
            <View style={[styles.plaque, tone === 'dark' && { borderColor: 'rgba(255,255,255,0.5)' }]}>
              <Text style={[styles.plaqueText, { color: sub }]}>{treeCopy.memberBadge(memberSince)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fruit: { position: 'absolute', backgroundColor: colors.amber },
  name: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  caption: { fontSize: 12, textAlign: 'center' },
  plaque: {
    marginTop: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  plaqueText: { fontSize: 11, letterSpacing: 0.3 },
});
