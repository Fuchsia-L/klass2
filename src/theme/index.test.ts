import { getAllThemes, getTheme, THEME_OPTIONS } from './index';

describe('theme registry', () => {
  it('exposes legacy themes plus the Minimal palette set', () => {
    expect(Object.keys(getAllThemes())).toHaveLength(15);
    expect(THEME_OPTIONS).toHaveLength(15);
    expect(THEME_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'hanami', label: 'Sakura 桜' }),
        expect.objectContaining({ name: 'ocean', label: 'Ocean' }),
        expect.objectContaining({ name: 'minimal-black', label: 'Minimal Black' }),
        expect.objectContaining({ name: 'minimal-ghost', label: 'Minimal Ghost' }),
        expect.objectContaining({ name: 'minimal-graphite', label: 'Minimal Graphite' }),
        expect.objectContaining({ name: 'starlight-nebula', label: 'Starlight Nebula' }),
        expect.objectContaining({ name: 'starlight-midnight', label: 'Starlight Midnight' }),
        expect.objectContaining({ name: 'starlight-twilight', label: 'Starlight Twilight' }),
        expect.objectContaining({ name: 'starlight-abyss', label: 'Starlight Abyss' }),
      ]),
    );

    expect(getTheme('hanami')).toMatchObject({ id: 'hanami', name: 'Sakura 桜' });
    expect(getTheme('ocean')).toMatchObject({ id: 'ocean', name: 'Ocean' });
    expect(getTheme('minimal-ink')).toMatchObject({ id: 'minimal-ink' });
    expect(getTheme('starlight-nebula')).toMatchObject({ id: 'starlight-nebula', name: 'Starlight Nebula' });
    expect(getTheme('starlight-midnight')).toMatchObject({ id: 'starlight-midnight', name: 'Starlight Midnight' });
  });

  it('keeps legacy themes working without optional tokens', () => {
    const cyber = getTheme('cyber');

    expect(cyber.id).toBe('cyber');
    expect(cyber.colors.warning).toBeUndefined();
    expect(cyber.categoryColors).toBeUndefined();
  });
});
