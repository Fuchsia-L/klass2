import { useEffect } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type TwinkleVariant = 'twinkleA' | 'twinkleB' | 'twinkleC';
export type ShootVariant = 'shootA' | 'shootB' | 'shootC';
export type FlyVariant = 'flyA' | 'flyB' | 'flyC';

const easeInOut = Easing.inOut(Easing.ease);
const linear = Easing.linear;

export function useTwinkle(variant: TwinkleVariant, duration: number, delay: number) {
  const progress = useSharedValue(variant === 'twinkleA' ? 0.15 : variant === 'twinkleB' ? 0.25 : 0.35);
  const scale = useSharedValue(variant === 'twinkleC' ? 0.9 : 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (variant === 'twinkleA') {
        progress.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: duration / 2, easing: easeInOut }),
            withTiming(0.15, { duration: duration / 2, easing: easeInOut }),
          ),
          -1,
          false,
        );
        return;
      }

      if (variant === 'twinkleB') {
        progress.value = withRepeat(
          withSequence(
            withTiming(0.25, { duration: duration * 0.88, easing: linear }),
            withTiming(1, { duration: duration * 0.04, easing: easeInOut }),
            withTiming(0.6, { duration: duration * 0.04, easing: easeInOut }),
            withTiming(0.25, { duration: duration * 0.04, easing: easeInOut }),
          ),
          -1,
          false,
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: duration * 0.88, easing: linear }),
            withTiming(1.4, { duration: duration * 0.04, easing: easeInOut }),
            withTiming(1, { duration: duration * 0.08, easing: easeInOut }),
          ),
          -1,
          false,
        );
        return;
      }

      progress.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.4, easing: easeInOut }),
          withTiming(0.5, { duration: duration * 0.2, easing: easeInOut }),
          withTiming(0.35, { duration: duration * 0.4, easing: easeInOut }),
        ),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: duration * 0.4, easing: easeInOut }),
          withTiming(1, { duration: duration * 0.2, easing: easeInOut }),
          withTiming(0.9, { duration: duration * 0.4, easing: easeInOut }),
        ),
        -1,
        false,
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, progress, scale, variant]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: scale.value }],
  }));
}

export function useShootingStar(variant: ShootVariant) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const startDelay = variant === 'shootA' ? 1500 : variant === 'shootB' ? 9000 : 16500;
    const flashMs = 3200;
    const cycleMs = 22000;
    const idleMs = cycleMs - flashMs;

    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: flashMs, easing: linear }),
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: idleMs, easing: linear }),
        ),
        -1,
        false,
      );
    }, startDelay);

    return () => clearTimeout(timer);
  }, [progress, variant]);

  return useAnimatedStyle(() => {
    const travelX = variant === 'shootA' ? -240 : variant === 'shootB' ? -200 : -280;
    const travelY = variant === 'shootA' ? 80 : variant === 'shootB' ? 60 : 110;
    const rotate = variant === 'shootA' ? '-20deg' : variant === 'shootB' ? '-15deg' : '-28deg';
    const travel = interpolate(progress.value, [0, 1], [0, 1], 'clamp');
    const opacity = interpolate(progress.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0], 'clamp');

    return {
      opacity,
      transform: [{ translateX: travelX * travel }, { translateY: travelY * travel }, { rotate }],
    };
  });
}

export function useFirefly(variant: FlyVariant, duration: number, delay: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: duration * 0.3, easing: easeInOut }),
          withTiming(0.7, { duration: duration * 0.3, easing: easeInOut }),
          withTiming(1, { duration: duration * 0.4, easing: easeInOut }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, progress]);

  return useAnimatedStyle(() => {
    const points =
      variant === 'flyA'
        ? { x: [0, 6, 14, 4, 0], y: [0, -10, 4, 12, 0], o: [0.2, 0.8, 0.35, 0.9, 0.2] }
        : variant === 'flyB'
          ? { x: [0, -10, -4, 10, 0], y: [0, 6, -10, -4, 0], o: [0.3, 0.85, 0.4, 0.95, 0.3] }
          : { x: [0, 2, -6, 0], y: [0, 16, 8, 0], o: [0.15, 0.7, 0.4, 0.15] };
    const input = variant === 'flyC' ? [0, 0.4, 0.7, 1] : [0, 0.2, 0.5, 0.7, 1];

    return {
      opacity: interpolate(progress.value, input, points.o),
      transform: [
        { translateX: interpolate(progress.value, input, points.x) },
        { translateY: interpolate(progress.value, input, points.y) },
      ],
    };
  });
}

export function useMoonPulse(enabled: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: easeInOut }),
        withTiming(0, { duration: 1600, easing: easeInOut }),
      ),
      -1,
      false,
    );
  }, [enabled, progress]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.72, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1.08]) }],
  }));
}

export function useCloudDrift(duration = 50000, delay = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withSequence(withTiming(1, { duration, easing: linear }), withTiming(0, { duration: 0 })),
        -1,
        false,
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, progress]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-90, 520]) }],
  }));
}

export function useNowShimmer() {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: easeInOut }),
        withTiming(0.6, { duration: 1500, easing: easeInOut }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
