import React from 'react';
import type { ThemePackage, RouteName } from '../types';
import { StarlightRoot } from './components/StarlightRoot';
import { starlightNebulaPalette } from './palettes/nebula';
import { starlightMidnightPalette } from './palettes/midnight';
import { starlightTwilightPalette } from './palettes/twilight';
import { starlightAbyssPalette } from './palettes/abyss';

export const starlightPackage: ThemePackage = {
  id: 'starlight',
  name: 'Starlight',
  palettes: [
    starlightNebulaPalette,
    starlightMidnightPalette,
    starlightTwilightPalette,
    starlightAbyssPalette,
  ],
  renderRoot(route: RouteName) {
    return React.createElement(StarlightRoot, { route });
  },
};
