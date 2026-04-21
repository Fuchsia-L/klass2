jest.mock('../theme/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    id: 'minimal-black',
    colors: {},
    fonts: {},
    radius: {},
  }),
  useThemeSettings: () => ({ themeName: 'minimal-black', setThemeName: jest.fn() }),
}));

import { getAllPalettes, resolvePalette, starlightPackage, themePackages } from './index';

describe('theme package registry', () => {
  it('resolves the Starlight Nebula palette to the Starlight package', () => {
    const resolved = resolvePalette('starlight-nebula');

    expect(resolved).not.toBeNull();
    expect(resolved?.pkg).toBe(starlightPackage);
    expect(resolved?.palette).toBe(starlightPackage.palettes[0]);
    expect(resolved?.palette.id).toBe('starlight-nebula');
  });

  it('includes Starlight without removing the existing packages', () => {
    expect(themePackages.map((pkg) => pkg.id)).toEqual(['legacy', 'minimal', 'starlight']);
    expect(getAllPalettes().map((palette) => palette.id)).toContain('starlight-nebula');
  });
});
