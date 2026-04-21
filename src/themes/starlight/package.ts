import React from 'react';
import type { ThemePackage, RouteName } from '../types';
import { StarlightRoot } from './components/StarlightRoot';
import { starlightNebulaPalette } from './palettes/nebula';

export const starlightPackage: ThemePackage = {
  id: 'starlight',
  name: 'Starlight',
  palettes: [starlightNebulaPalette],
  renderRoot(route: RouteName) {
    return React.createElement(StarlightRoot, { route });
  },
};
