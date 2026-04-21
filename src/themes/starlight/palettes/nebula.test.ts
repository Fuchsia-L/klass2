import { starlightNebulaPalette } from './nebula';

describe('starlightNebulaPalette', () => {
  it('provides a complete ThemeConfig with Starlight fonts and required tokens', () => {
    const theme = starlightNebulaPalette.themeConfig;

    expect(theme).toMatchObject({
      id: 'starlight-nebula',
      name: 'Starlight Nebula',
      colors: {
        bg: expect.any(String),
        card: expect.any(String),
        cardBorder: expect.any(String),
        primary: expect.any(String),
        accent: expect.any(String),
        success: expect.any(String),
        ratingFill: expect.any(String),
        danger: expect.any(String),
        textMain: expect.any(String),
        textSub: expect.any(String),
        overlay: expect.any(String),
        inputBg: expect.any(String),
        divider: expect.any(String),
        priorityHigh: expect.any(String),
        priorityMedium: expect.any(String),
        priorityLow: expect.any(String),
      },
      fonts: {
        heading: 'Fraunces-SemiBold',
        body: 'Inter-Regular',
      },
      radius: {
        card: expect.any(Number),
        button: expect.any(Number),
        sheet: expect.any(Number),
      },
    });

    expect(theme.colors.ratingFill).toBe('#ffd89b');
    expect(theme.fonts.heading).toMatch(/^Fraunces-/);
    expect(theme.fonts.body).toMatch(/^Inter-/);
  });
});
