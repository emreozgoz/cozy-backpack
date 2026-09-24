// Room geometry — pure math, shared by the scene, the home screen hotspots and tests.

export interface RoomLayout {
  w: number;
  h: number;
  /** Unit that scales strokes and details with the room size. */
  u: number;
  wallBottom: number;
  window: Box;
  wallArt: Box;
  calendar: Box;
  deskTop: number;
  desk: Box;
  backpack: Box;
  lamp: Box;
  plant: Box;
  rug: { cx: number; cy: number; rx: number; ry: number };
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function roomLayout(w: number, h: number): RoomLayout {
  const u = Math.min(w, h / 1.6) / 390;
  const wallBottom = h * 0.66;
  const deskTop = h * 0.57;
  // The backpack sits between the desk and the wall calendar: on squarer
  // screens (iPad) its height, not the width, is what limits it.
  const calendarBottom = h * 0.29 + h * 0.13;
  const bpH = Math.min(Math.min(w * 0.3, 150 * u) * 0.95, deskTop + 4 * u - calendarBottom - 8 * u);
  const bpW = bpH / 0.95;
  return {
    w,
    h,
    u,
    wallBottom,
    window: { x: w * 0.07, y: h * 0.08, w: w * 0.38, h: h * 0.25 },
    wallArt: { x: w * 0.56, y: h * 0.09, w: w * 0.32, h: h * 0.16 },
    calendar: { x: w * 0.6, y: h * 0.29, w: w * 0.24, h: h * 0.13 },
    deskTop,
    desk: { x: w * 0.08, y: deskTop, w: w * 0.84, h: h * 0.035 },
    backpack: { x: w * 0.52 - bpW / 2, y: deskTop - bpH + 4 * u, w: bpW, h: bpH },
    lamp: { x: w * 0.13, y: deskTop - 120 * u, w: 70 * u, h: 120 * u },
    plant: { x: w * 0.78, y: h * 0.72, w: w * 0.18, h: h * 0.2 },
    rug: { cx: w * 0.46, cy: h * 0.86, rx: w * 0.38, ry: h * 0.065 },
  };
}

export type Daylight = 'morning' | 'day' | 'evening' | 'night';

export function daylightFor(hour: number, isDark: boolean): Daylight {
  if (isDark) return 'night';
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
