import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ThemePalette } from '../../types';
import { STARLIGHT_NEBULA_COLORS, starlightNebulaPalette } from '../palettes/nebula';
import { StarSettings } from './StarSettings';

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
  it('renders palette cards from the provided palette list and exposes the active palette id', () => {
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-dusk"
        palettes={[starlightNebulaPalette, duskPalette]}
        onSelectPalette={jest.fn()}
      />,
    );

    expect(result.getByText('Settings')).toBeTruthy();
    expect(result.getByTestId('starlight-palette-starlight-nebula')).toBeTruthy();
    expect(result.getByTestId('starlight-palette-starlight-dusk')).toBeTruthy();
    expect(result.getByText('Nebula')).toBeTruthy();
    expect(result.getByText('Dusk')).toBeTruthy();
    expect(result.getByTestId('starlight-palette-active-starlight-dusk')).toBeTruthy();
    expect(result.getByTestId('starlight-settings-current-palette-id').props.children).toBe('starlight-dusk');
  });

  it('selects palettes through the provided global theme callback', () => {
    const onSelectPalette = jest.fn();
    const result = render(
      <StarSettings
        p={STARLIGHT_NEBULA_COLORS}
        paletteId="starlight-nebula"
        palettes={[starlightNebulaPalette, duskPalette]}
        onSelectPalette={onSelectPalette}
      />,
    );

    fireEvent.press(result.getByTestId('starlight-palette-starlight-dusk'));

    expect(onSelectPalette).toHaveBeenCalledWith('starlight-dusk');
  });
});
