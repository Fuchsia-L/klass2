import React from 'react';
import type { ThemePackage, RouteName } from '../types';
import { starlightNebulaPalette } from './palettes/nebula';

export const starlightPackage: ThemePackage = {
  id: 'starlight',
  name: 'Starlight',
  palettes: [starlightNebulaPalette],
  renderRoot(_route: RouteName) {
    return React.createElement(React.Fragment);
  },
};
