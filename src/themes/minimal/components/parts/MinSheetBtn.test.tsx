import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { MinimalPaletteColors } from '../minimalTypes';
import { MinSheetBtn } from './MinSheetBtn';

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

function flattenButtonStyle(style: unknown) {
  const resolvedStyle = typeof style === 'function' ? style({ pressed: false, hovered: false, focused: false }) : style;
  return StyleSheet.flatten(resolvedStyle) ?? {};
}

describe('MinSheetBtn shared seam', () => {
  it('uses a zero left border on primary buttons instead of a negative margin overlap', () => {
    const { getByTestId } = render(
      <>
        <MinSheetBtn p={paletteColors} label="Cancel" testID="cancel-action" onPress={jest.fn()} />
        <MinSheetBtn p={paletteColors} label="Save" testID="save-action" primary flex={2} onPress={jest.fn()} />
      </>,
    );

    const cancelStyle = flattenButtonStyle(getByTestId('cancel-action').props.style);
    const saveStyle = flattenButtonStyle(getByTestId('save-action').props.style);

    expect(cancelStyle).toMatchObject({
      borderWidth: 1,
      borderLeftWidth: 1,
      flex: 1,
      backgroundColor: 'transparent',
    });
    expect(saveStyle).toMatchObject({
      borderWidth: 1,
      borderLeftWidth: 0,
      flex: 2,
      backgroundColor: paletteColors.ink,
    });
    expect(saveStyle.marginLeft).toBeUndefined();
  });

  it('applies the same non-overlap seam style to Skip and Save sheet actions', () => {
    const { getByTestId } = render(
      <>
        <MinSheetBtn p={paletteColors} label="Skip" testID="skip-action" onPress={jest.fn()} />
        <MinSheetBtn p={paletteColors} label="Save" testID="save-action" primary flex={2} onPress={jest.fn()} />
      </>,
    );

    const skipStyle = flattenButtonStyle(getByTestId('skip-action').props.style);
    const saveStyle = flattenButtonStyle(getByTestId('save-action').props.style);

    expect(skipStyle.borderLeftWidth).toBe(1);
    expect(saveStyle.borderLeftWidth).toBe(0);
    expect(saveStyle.marginLeft).toBeUndefined();
  });
});
