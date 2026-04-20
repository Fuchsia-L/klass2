import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MinSettings } from './MinSettings';
import type { MinimalPaletteColors } from './minimalTypes';

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
