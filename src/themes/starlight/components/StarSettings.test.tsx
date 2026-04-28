import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ThemePalette } from '../../types';
import { STARLIGHT_NEBULA_COLORS, starlightNebulaPalette } from '../palettes/nebula';
import { StarSettings } from './StarSettings';

const mockSetThemeName = jest.fn();

jest.mock('../../../theme/ThemeContext', () => ({
  useThemeSettings: () => ({ themeName: 'starlight-nebula', setThemeName: mockSetThemeName }),
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
    start: jest.fn(),
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

const duskPalette: ThemePalette = {
  ...starlightNebulaPalette,
  id: 'starlight-dusk',
  label: 'Starlight Dusk',
  sub: 'soft rose twilight',
  preview: {
    bg: '#20133a',
    ink: '#ffeaf8',
    accent: '#ff9fd7',
    line: 'rgba(255,255,255,0.2)',
  },
  themeConfig: {
    ...starlightNebulaPalette.themeConfig,
    id: 'starlight-dusk',
    name: 'Starlight Dusk',
  },
};

describe('StarSettings', () => {
  beforeEach(() => {
    mockSetThemeName.mockClear();
  });

  it('renders palette cards from the provided palette list and exposes the active palette id', async () => {
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-dusk"
        palettes={[starlightNebulaPalette, duskPalette]}
        onSelectPalette={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(result.getByText('Settings')).toBeTruthy();
    });

    expect(result.getByTestId('starlight-palette-starlight-nebula')).toBeTruthy();
    expect(result.getByTestId('starlight-palette-starlight-dusk')).toBeTruthy();
    expect(result.getByText('Nebula')).toBeTruthy();
    expect(result.getByText('Dusk')).toBeTruthy();
    expect(result.getByTestId('starlight-palette-active-starlight-dusk')).toBeTruthy();
    expect(result.getByTestId('starlight-settings-current-palette-id').props.children).toBe('starlight-dusk');
  });

  it('selects palettes through the provided callback', async () => {
    const onSelectPalette = jest.fn();
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-nebula"
        palettes={[starlightNebulaPalette, duskPalette]}
        onSelectPalette={onSelectPalette}
      />,
    );

    await waitFor(() => {
      expect(result.getByText('Settings')).toBeTruthy();
    });

    fireEvent.press(result.getByTestId('starlight-palette-starlight-dusk'));

    expect(onSelectPalette).toHaveBeenCalledWith('starlight-dusk');
  });

  it('falls back to setThemeName for palette selection when no callback is provided', async () => {
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-nebula"
        palettes={[starlightNebulaPalette, duskPalette]}
      />,
    );

    await waitFor(() => {
      expect(result.getByText('Settings')).toBeTruthy();
    });

    fireEvent.press(result.getByTestId('starlight-palette-starlight-dusk'));

    expect(mockSetThemeName).toHaveBeenCalledWith('starlight-dusk');
  });

  it('exits Starlight by routing to the first legacy palette id when Change is pressed', async () => {
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-nebula"
        palettes={[starlightNebulaPalette, duskPalette]}
      />,
    );

    await waitFor(() => {
      expect(result.getByText('Change')).toBeTruthy();
    });

    fireEvent.press(result.getByText('Change'));

    expect(mockSetThemeName).toHaveBeenCalledWith('rename-safe-legacy-baseline');
  });
});
