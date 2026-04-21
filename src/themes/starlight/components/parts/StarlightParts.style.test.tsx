import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { STARLIGHT_NEBULA_COLORS } from '../../palettes/nebula';
import { StarlightMoon } from './StarlightMoon';
import { StarlightNowLine } from './StarlightNowLine';
import { StarlightSheetBtn } from './StarlightSheetBtn';

function flattenStyle(style: unknown) {
  const resolvedStyle =
    typeof style === 'function' ? style({ pressed: false, hovered: false, focused: false }) : style;
  return StyleSheet.flatten(resolvedStyle) ?? {};
}

describe('Starlight part palette styles', () => {
  it('applies moon palette face, shadow, and circular radius', () => {
    const { getByTestId } = render(<StarlightMoon p={STARLIGHT_NEBULA_COLORS} size={16} />);

    const moonStyle = flattenStyle(getByTestId('starlight-moon').props.style);
    const shadowStyle = flattenStyle(getByTestId('starlight-moon-shadow').props.style);

    expect(moonStyle).toMatchObject({
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: STARLIGHT_NEBULA_COLORS.moonFace,
      shadowColor: STARLIGHT_NEBULA_COLORS.nowGlow,
    });
    expect(shadowStyle.backgroundColor).toBe(STARLIGHT_NEBULA_COLORS.moonShadow);
  });

  it('applies now line shimmer palette colors', () => {
    const { getByTestId } = render(<StarlightNowLine p={STARLIGHT_NEBULA_COLORS} time="10:30" />);

    const lineStyle = flattenStyle(getByTestId('starlight-now-line-bar').props.style);
    const labelStyle = flattenStyle(getByTestId('starlight-now-line-label').props.style);

    expect(lineStyle.backgroundColor).toBe(STARLIGHT_NEBULA_COLORS.nowLine);
    expect(lineStyle.shadowColor).toBe(STARLIGHT_NEBULA_COLORS.nowGlow);
    expect(labelStyle.color).toBe(STARLIGHT_NEBULA_COLORS.nowLine);
  });

  it('uses pill radius and Starlight accent colors on sheet buttons', () => {
    const { getByTestId } = render(
      <>
        <StarlightSheetBtn p={STARLIGHT_NEBULA_COLORS} label="Close" testID="close-action" onPress={jest.fn()} />
        <StarlightSheetBtn
          p={STARLIGHT_NEBULA_COLORS}
          label="Save"
          testID="save-action"
          primary
          flex={2}
          onPress={jest.fn()}
        />
      </>,
    );

    const closeStyle = flattenStyle(getByTestId('close-action').props.style);
    const saveStyle = flattenStyle(getByTestId('save-action').props.style);

    expect(closeStyle).toMatchObject({
      borderRadius: 999,
      borderColor: STARLIGHT_NEBULA_COLORS.line,
      backgroundColor: 'transparent',
    });
    expect(saveStyle).toMatchObject({
      flex: 2,
      borderRadius: 999,
      borderColor: STARLIGHT_NEBULA_COLORS.accent,
      backgroundColor: STARLIGHT_NEBULA_COLORS.accent,
    });
  });
});
