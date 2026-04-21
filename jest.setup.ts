import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const sharedValue = (value: unknown) => ({ value });
  const identityAnimation = (value: unknown) => value;

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: React.ComponentType<any>) => Component,
    },
    Easing: {
      ease: jest.fn((value: number) => value),
      linear: jest.fn((value: number) => value),
      inOut: jest.fn((easing: unknown) => easing),
    },
    interpolate: jest.fn((value: number, input: number[], output: number[]) => {
      if (value <= input[0]) return output[0];
      if (value >= input[input.length - 1]) return output[output.length - 1];
      return output[0];
    }),
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useSharedValue: sharedValue,
    withRepeat: identityAnimation,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: identityAnimation,
  };
});

jest.mock(
  'react-native-webview',
  () => {
    const React = require('react');
    const { View } = require('react-native');
    const injectJavaScriptMock = jest.fn();
    const reloadMock = jest.fn();

    const MockWebView = React.forwardRef(
      ({ testID = 'mock-webview', ...props }: ViewProps & { testID?: string }, ref: ForwardedRef<any>) => {
        React.useImperativeHandle(ref, () => ({
          injectJavaScript: injectJavaScriptMock,
          reload: reloadMock,
        }));

        return React.createElement(View, { ...props, testID });
      },
    );

    MockWebView.displayName = 'MockWebView';

    return {
      __esModule: true,
      __mock: {
        injectJavaScriptMock,
        reloadMock,
      },
      default: MockWebView,
      WebView: MockWebView,
    };
  },
  { virtual: true },
);

afterEach(async () => {
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  const AsyncStorage = asyncStorageModule.default ?? asyncStorageModule;

  jest.clearAllMocks();
  await AsyncStorage.clear();
});
