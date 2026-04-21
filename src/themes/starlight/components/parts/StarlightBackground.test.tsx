import React from 'react';
import { render } from '@testing-library/react-native';
import { STARLIGHT_NEBULA_COLORS } from '../../palettes/nebula';
import {
  STARLIGHT_FIREFLIES,
  STARLIGHT_SHOOTING_STARS,
  STARLIGHT_STARS,
  Starfield,
  StarlightBackground,
} from './StarlightBackground';

describe('StarlightBackground celestial primitives', () => {
  it('renders the deterministic star and shooting-star counts in Starfield', () => {
    const { getAllByTestId } = render(<Starfield p={STARLIGHT_NEBULA_COLORS} />);

    expect(STARLIGHT_STARS).toHaveLength(72);
    expect(STARLIGHT_SHOOTING_STARS).toHaveLength(3);
    expect(getAllByTestId('starlight-star')).toHaveLength(STARLIGHT_STARS.length);
    expect(getAllByTestId('starlight-shooting-star')).toHaveLength(STARLIGHT_SHOOTING_STARS.length);
  });

  it('renders background starfield, shooting stars, and deterministic fireflies', () => {
    const { getAllByTestId, getByTestId } = render(<StarlightBackground p={STARLIGHT_NEBULA_COLORS} />);

    expect(getByTestId('starlight-background')).toBeTruthy();
    expect(getAllByTestId('starlight-star')).toHaveLength(72);
    expect(getAllByTestId('starlight-shooting-star')).toHaveLength(3);
    expect(getAllByTestId('starlight-firefly')).toHaveLength(STARLIGHT_FIREFLIES.length);
    expect(STARLIGHT_STARS[0]).toMatchObject({ anim: 'twinkleB', isStatic: false });
    expect(STARLIGHT_FIREFLIES.map((item) => item.variant)).toEqual(['flyA', 'flyB', 'flyC', 'flyA', 'flyB']);
  });
});
