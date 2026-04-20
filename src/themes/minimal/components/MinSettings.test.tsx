import React from 'react';
import { StyleSheet, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MinSettings } from './MinSettings';
import { MinPaletteCell } from './parts/MinPaletteCell';
import type { MinimalPaletteColors, PaletteChoice } from './minimalTypes';
import { minimalBlackPalette } from '../palettes/black';

const mockSetThemeName = jest.fn();

jest.mock('../../../theme/ThemeContext', () => ({
  useThemeSettings: () => ({ setThemeName: mockSetThemeName }),
}));

jest.mock('../../legacy/package', () => ({
  legacyPackage: {
    palettes: [
      {
        id: 'rename-safe-legacy-baseline',
        label: 'Renamed Legacy Baseline',
        preview: {
          bg: '#000000',
          ink: '#ffffff',
          accent: '#ff0000',
          line: '#333333',
        },
        themeConfig: {},
      },
    ],
  },
}));

jest.mock('../../../features/rating', () => ({
  getConfiguredSyncScheduler: jest.fn(() => ({
    getStatus: jest.fn(() => ({ kind: 'idle', lastSyncAt: null })),
    onStatusChange: jest.fn(() => () => {}),
    notifyLocalChange: jest.fn(),
    pullNow: jest.fn().mockResolvedValue(undefined),
  })),
  saveSyncToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../features/settings/services/settings.service', () => ({
  loadSettings: jest.fn().mockResolvedValue({ semester: null }),
  saveSemesterSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../features/settings/services/rating-export.service', () => ({
  exportLocalRatingsAsJson: jest.fn().mockResolvedValue({
    count: 0,
    json: '[]',
    method: 'react-native-share',
  }),
}));

jest.mock('../../../features/schedule', () => ({
  extractArrangedScheduleItems: jest.fn(() => []),
  importWhutArrangedList: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../features/schedule/import/WhutImportModal', () => ({
  WhutImportStatus: undefined,
  WhutImportModal: () => null,
}));

const paletteColors: MinimalPaletteColors = {
  bg: '#ffffff',
  ink: '#111111',
  dim: '#777777',
  line: '#dddddd',
  subtle: '#555555',
  panel: '#f7f7f7',
  accent: '#ff0000',
  nowLine: '#ff0000',
  sheetScrim: 'rgba(0,0,0,0.2)',
};

function flattenStyle(style: unknown): Record<string, unknown> {
  return (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
}

function makePalette(overrides: Partial<PaletteChoice>): PaletteChoice {
  return {
    ...minimalBlackPalette,
    ...overrides,
    preview: {
      ...minimalBlackPalette.preview,
      ...overrides.preview,
    },
  };
}

describe('MinSettings theme exit', () => {
  beforeEach(() => {
    mockSetThemeName.mockClear();
  });

  it('uses the first legacy palette id when leaving Minimal instead of a hardcoded palette id', async () => {
    const { getByText } = render(
      <MinSettings
        p={paletteColors}
        paletteId="minimal-paper"
        palettes={[]}
      />,
    );

    await waitFor(() => {
      expect(getByText('Change')).toBeTruthy();
    });

    fireEvent.press(getByText('Change'));

    expect(mockSetThemeName).toHaveBeenCalledWith('rename-safe-legacy-baseline');
    expect(mockSetThemeName).not.toHaveBeenCalledWith('cyber');
  });
});

describe('MinPaletteCell palette colors', () => {
  it('uses active palette colors for labels while swatches preview the candidate palette', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <MinPaletteCell
        p={paletteColors}
        palette={minimalBlackPalette}
        selected={false}
        onPress={jest.fn()}
      />,
    );

    expect(flattenStyle(getByText('Black').props.style)).toEqual(
      expect.objectContaining({ color: paletteColors.ink }),
    );
    expect(flattenStyle(getByText('pure black on white').props.style)).toEqual(
      expect.objectContaining({ color: paletteColors.subtle }),
    );

    const views = UNSAFE_getAllByType(View);
    const swatch = views.find((view) => {
      const style = flattenStyle(view.props.style);
      return style.width === 36 && style.height === 36;
    });
    expect(flattenStyle(swatch?.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        borderColor: '#e5e5e5',
      }),
    );

    const swatchChildren = swatch?.props.children as Array<React.ReactElement<{ style?: unknown }>>;
    expect(flattenStyle(swatchChildren[0].props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#ffffff' }),
    );
    expect(flattenStyle(swatchChildren[1].props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#000000' }),
    );
  });

  it('falls back to the active palette when the candidate palette id is unmapped', () => {
    const unknownPalette = makePalette({
      id: 'minimal-unmapped',
      label: 'Minimal Mystery',
      sub: 'unknown palette',
    });

    const { getByText, UNSAFE_getAllByType } = render(
      <MinPaletteCell
        p={paletteColors}
        palette={unknownPalette}
        selected
        onPress={jest.fn()}
      />,
    );

    expect(flattenStyle(getByText('Mystery').props.style)).toEqual(
      expect.objectContaining({ color: paletteColors.ink }),
    );
    expect(flattenStyle(getByText('unknown palette').props.style)).toEqual(
      expect.objectContaining({ color: paletteColors.subtle }),
    );

    const views = UNSAFE_getAllByType(View);
    const swatch = views.find((view) => {
      const style = flattenStyle(view.props.style);
      return style.width === 36 && style.height === 36;
    });
    expect(flattenStyle(swatch?.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: paletteColors.bg,
        borderColor: paletteColors.line,
      }),
    );
  });
});
