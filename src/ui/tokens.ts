import { useColorScheme } from 'react-native';

export { itemColor, itemColors } from './colors';

const light = {
  bg: '#FFF6EC',
  surface: '#FFFFFF',
  surfaceWarm: '#FDEFE0',
  text: '#5B4636',
  textMuted: '#9C8574',
  primary: '#F79E89',
  success: '#8CCB9B',
  gentleWarn: '#F6C177',
  shadow: 'rgba(91,70,54,0.12)',
  gridLine: 'rgba(91,70,54,0.14)',
  bagBody: '#F4B8A4',
  bagInside: '#FBE3D6',
  desk: '#E9CDAE',
  deskEdge: '#D9B893',
  note: '#FFFBEF',
  tape: 'rgba(205,180,240,0.55)',
};

const dark: typeof light = {
  bg: '#241E2B',
  surface: '#332A3B',
  surfaceWarm: '#3A3040',
  text: '#F5E9DC',
  textMuted: '#B7A89C',
  primary: '#F4A896',
  success: '#7DBB8C',
  gentleWarn: '#E6B064',
  shadow: 'rgba(0,0,0,0.35)',
  gridLine: 'rgba(245,233,220,0.12)',
  bagBody: '#B97F72',
  bagInside: '#4A3B4C',
  desk: '#5A4638',
  deskEdge: '#4A382C',
  note: '#EFE4D2',
  tape: 'rgba(174,149,214,0.55)',
};

export type Palette = typeof light & { isDark: boolean };

export function usePalette(): Palette {
  const isDark = useColorScheme() === 'dark';
  return { ...(isDark ? dark : light), isDark };
}

export const radius = { s: 12, m: 18, l: 24 };
