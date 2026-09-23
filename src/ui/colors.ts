// Pure color data (no React Native imports) so art can render headless too.

/** Named item colors used by items.json ("math", "coral", …). */
export const itemColors: Record<string, { light: string; dark: string }> = {
  math: { light: '#A8D8F0', dark: '#86BCD8' },
  turkish: { light: '#F79E89', dark: '#E88F7B' },
  science: { light: '#BDE7C9', dark: '#8FC8A2' },
  life: { light: '#C9E4A6', dark: '#A3C27F' },
  social: { light: '#F2D0A4', dark: '#D6B283' },
  history: { light: '#FFE29A', dark: '#E8CB7E' },
  english: { light: '#FFC8A2', dark: '#E8AE87' },
  art: { light: '#CDB4F0', dark: '#AE95D6' },
  music: { light: '#F7B6C8', dark: '#DC98AC' },
  pe: { light: '#F9B97C', dark: '#DDA066' },
  sky: { light: '#A8D8F0', dark: '#86BCD8' },
  coral: { light: '#F79E89', dark: '#E88F7B' },
  mint: { light: '#BDE7C9', dark: '#8FC8A2' },
  butter: { light: '#FFE29A', dark: '#E8CB7E' },
  lavender: { light: '#CDB4F0', dark: '#AE95D6' },
  pink: { light: '#F7B6C8', dark: '#DC98AC' },
};

export function itemColor(name: string, isDark: boolean): string {
  const c = itemColors[name] ?? itemColors.coral;
  return isDark ? c.dark : c.light;
}
