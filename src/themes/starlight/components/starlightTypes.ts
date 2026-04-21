export type StarlightPaletteColors = {
  dark: boolean;
  bg: string;
  bgGrad: string;
  ink: string;
  dim: string;
  line: string;
  subtle: string;
  panel: string;
  panelSolid: string;
  accent: string;
  accent2: string;
  nowLine: string;
  nowGlow: string;
  moonFace: string;
  moonShadow: string;
  star: string;
  firefly: string;
  sheetScrim: string;
  galaxy: string;
};

export type StarlightPaletteId = 'starlight-nebula';

export type StarlightPaletteMap = Record<StarlightPaletteId, StarlightPaletteColors>;
