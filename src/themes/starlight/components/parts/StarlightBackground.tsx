import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { StarlightPaletteColors } from '../starlightTypes';
import type { FlyVariant, ShootVariant, TwinkleVariant } from './starlightMotion';
import { useCloudDrift, useFirefly, useShootingStar, useTwinkle } from './starlightMotion';

type Props = {
  p: StarlightPaletteColors;
  testID?: string;
  children?: React.ReactNode;
};

export type StarPoint = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  bright: number;
  anim: TwinkleVariant;
  isStatic: boolean;
};

export type ShootingStarPoint = {
  variant: ShootVariant;
  left: `${number}%`;
  top: `${number}%`;
  width: number;
};

export type FireflyPoint = {
  variant: FlyVariant;
  top: number;
  right?: number;
  left?: number;
  size: number;
  duration: number;
  delay: number;
};

const TWINKLES: TwinkleVariant[] = ['twinkleA', 'twinkleB', 'twinkleC'];

export const STARLIGHT_STARS: StarPoint[] = Array.from({ length: 72 }, (_, i) => {
  const seed = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  const r1 = seed(1);
  const r2 = seed(2);
  const r3 = seed(3);
  const r4 = seed(4);
  const r5 = seed(5);
  const r6 = seed(6);
  const r7 = seed(7);
  const variant = Math.floor(r7 * 3);
  const isStatic = r6 < 0.18;

  return {
    x: r1 * 100,
    y: r2 * 100,
    size: isStatic ? 0.5 + r3 * 0.7 : 0.6 + r3 * 2,
    delay: r4 * 8000,
    duration: [4200, 7500, 5400][variant] + r5 * 2000,
    bright: 0.35 + r6 * 0.55,
    anim: TWINKLES[variant],
    isStatic,
  };
});

export const STARLIGHT_SHOOTING_STARS: ShootingStarPoint[] = [
  { variant: 'shootA', left: '85%', top: '6%', width: 80 },
  { variant: 'shootB', left: '95%', top: '32%', width: 60 },
  { variant: 'shootC', left: '78%', top: '18%', width: 90 },
];

export const STARLIGHT_FIREFLIES: FireflyPoint[] = [
  { variant: 'flyA', top: 94, right: 28, size: 3, duration: 5800, delay: 400 },
  { variant: 'flyB', top: 188, left: 30, size: 2, duration: 6400, delay: 1300 },
  { variant: 'flyC', top: 326, right: 54, size: 4, duration: 7200, delay: 2600 },
  { variant: 'flyA', top: 496, right: 18, size: 2, duration: 6100, delay: 3900 },
  { variant: 'flyB', top: 612, left: 46, size: 3, duration: 6900, delay: 5200 },
];

function Star({ star, index, p }: { star: StarPoint; index: number; p: StarlightPaletteColors }) {
  const animatedStyle = useTwinkle(star.anim, star.duration, star.delay);

  return (
    <Animated.View
      testID="starlight-star"
      style={[
        styles.star,
        {
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          backgroundColor: p.star,
          opacity: star.isStatic ? star.bright * 0.55 : star.bright,
          shadowColor: p.star,
          shadowOpacity: p.dark && star.size > 1.2 ? 0.8 : 0,
          shadowRadius: star.size * 2.2,
        },
        star.isStatic ? null : animatedStyle,
      ]}
      accessibilityLabel={`starlight star ${index + 1}`}
    />
  );
}

function ShootingStar({ item, p }: { item: ShootingStarPoint; p: StarlightPaletteColors }) {
  const animatedStyle = useShootingStar(item.variant);

  return (
    <Animated.View
      testID="starlight-shooting-star"
      style={[
        styles.shootingStar,
        {
          left: item.left,
          top: item.top,
          width: item.width,
          backgroundColor: p.star,
          shadowColor: p.star,
        },
        animatedStyle,
      ]}
    />
  );
}

function Firefly({ item, p }: { item: FireflyPoint; p: StarlightPaletteColors }) {
  const animatedStyle = useFirefly(item.variant, item.duration, item.delay);

  return (
    <Animated.View
      testID="starlight-firefly"
      style={[
        styles.firefly,
        {
          top: item.top,
          left: item.left,
          right: item.right,
          width: item.size,
          height: item.size,
          backgroundColor: p.firefly,
          shadowColor: p.firefly,
          shadowRadius: item.size * 4,
        },
        animatedStyle,
      ]}
    />
  );
}

function CloudWash({ p }: { p: StarlightPaletteColors }) {
  const animatedStyle = useCloudDrift(50000, 0);

  return (
    <Animated.View
      testID="starlight-cloud-wash"
      style={[
        styles.cloud,
        {
          backgroundColor: p.dark ? 'rgba(180,170,230,0.08)' : 'rgba(255,255,255,0.55)',
        },
        animatedStyle,
      ]}
    />
  );
}

export function Starfield({ p }: Pick<Props, 'p'>) {
  return (
    <View pointerEvents="none" testID="starlight-starfield" style={StyleSheet.absoluteFill}>
      <View testID="starlight-galaxy-wash" style={[styles.galaxy, { backgroundColor: p.panel, borderColor: p.galaxy }]} />
      {STARLIGHT_STARS.map((star, index) => (
        <Star key={`${star.x}-${star.y}`} star={star} index={index} p={p} />
      ))}
      {p.dark
        ? STARLIGHT_SHOOTING_STARS.map((item) => <ShootingStar key={item.variant} item={item} p={p} />)
        : null}
    </View>
  );
}

export function StarlightBackground({ p, testID = 'starlight-background', children }: Props) {
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: p.bg }]}>
      <Starfield p={p} />
      <CloudWash p={p} />
      {STARLIGHT_FIREFLIES.map((item, index) => (
        <Firefly key={`${item.variant}-${index}`} item={item} p={p} />
      ))}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    borderRadius: 99,
    shadowOffset: { width: 0, height: 0 },
  },
  galaxy: {
    position: 'absolute',
    left: -70,
    right: -70,
    bottom: 80,
    height: 220,
    borderWidth: 1,
    borderRadius: 180,
    opacity: 0.28,
    transform: [{ rotate: '-8deg' }],
  },
  shootingStar: {
    position: 'absolute',
    height: 1,
    opacity: 0,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  firefly: {
    position: 'absolute',
    borderRadius: 99,
    shadowOpacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 1,
  },
  cloud: {
    position: 'absolute',
    top: 22,
    left: 0,
    width: 90,
    height: 38,
    borderRadius: 90,
    opacity: 0.78,
    zIndex: 1,
  },
});
