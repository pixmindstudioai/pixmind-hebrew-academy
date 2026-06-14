/**
 * Level system — mirrors the SQL `_level_from_xp` formula exactly.
 *
 *   xpAtLevel(L) = 50 * (L - 1) * L
 *   level(xp)    = floor( (50 + sqrt(2500 + 200 * xp)) / 100 )
 *
 *   L1 = 0xp · L2 = 100 · L3 = 300 · L4 = 600 · L5 = 1000 · L6 = 1500 ...
 *
 * Keep this in lockstep with supabase migration `_level_from_xp`.
 */

/** Total cumulative XP required to *reach* a given level. */
export function xpAtLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  return 50 * (L - 1) * L;
}

/** The numeric level for a given cumulative XP total. */
export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp || 0);
  return Math.max(1, Math.floor((50 + Math.sqrt(2500 + 200 * safe)) / 100));
}

export interface LevelInfo {
  level: number;
  xp: number;
  /** cumulative XP at the start of the current level */
  levelFloor: number;
  /** cumulative XP needed to reach the next level */
  nextLevelAt: number;
  /** XP earned inside the current level */
  xpIntoLevel: number;
  /** XP span of the current level */
  levelSpan: number;
  /** XP still needed to level up */
  xpToNext: number;
  /** 0..100 progress through the current level */
  progressPct: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp || 0));
  const level = levelFromXp(safe);
  const levelFloor = xpAtLevel(level);
  const nextLevelAt = xpAtLevel(level + 1);
  const levelSpan = Math.max(1, nextLevelAt - levelFloor);
  const xpIntoLevel = safe - levelFloor;
  const xpToNext = Math.max(0, nextLevelAt - safe);
  const progressPct = Math.min(100, Math.round((xpIntoLevel / levelSpan) * 100));
  return { level, xp: safe, levelFloor, nextLevelAt, xpIntoLevel, levelSpan, xpToNext, progressPct };
}

/** Hebrew flavour title per level band — purely cosmetic. */
export function levelTitle(level: number): string {
  if (level >= 20) return "אגדה";
  if (level >= 15) return "מאסטר";
  if (level >= 10) return "מומחה";
  if (level >= 7) return "מתקדם";
  if (level >= 4) return "חניך";
  if (level >= 2) return "מתחיל";
  return "טירון";
}

/** Fixed XP a single lesson completion awards (mirrors complete_lesson). */
export const LESSON_XP = 20;
