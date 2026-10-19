// The solver as it was before relevance pruning (v0.17.0), kept only as the yardstick the tests and the solver
// benchmark measure the current one against. The game never imports it.
import { makeGrid, placementsFor } from './grid';
import { findRoute } from './path';
import { DEFS } from './pieces';
import type { Level, PieceType, Placement } from './types';

const TYPE_NO = Object.fromEntries((Object.keys(DEFS) as PieceType[]).map((t, i) => [t, i])) as Record<PieceType, number>;
/** A placement as one small number (type, orientation, x up to 31, y up to 7), so visited sets are cheap to key */
const placeCode = (p: Placement): number => ((TYPE_NO[p.t] * 4 + p.o) * 32 + p.x) * 8 + p.y;
/** The same set of placements in any order gives the same key */
const setKey = (placed: readonly Placement[]): string =>
  placed
    .map(placeCode)
    .sort((a, b) => a - b)
    .join(',');

/**
 * All winning arrangements reachable from the start, in placement order; a branch stops as soon as it wins.
 * With `minLen`, the search stops early (and says `short`) the moment it finds a win using fewer pieces than that:
 * such a level is rejected anyway, so there is no need to finish the search.
 */
export function solve(lv: Level, cap = 400, { minLen = 0 }: { minLen?: number } = {}): { sols: Placement[][]; nodes: number; short: boolean } {
  const seen = new Set<string>();
  const sols: Placement[][] = [];
  let nodes = 0;
  let short = false;
  function dfs(placed: Placement[], left: PieceType[]) {
    if (sols.length >= cap || short) return;
    const key = setKey(placed);
    if (seen.has(key)) return;
    seen.add(key);
    nodes++;
    const g = makeGrid(lv, placed);
    if (findRoute(g, lv.hero, lv.goal, lv.stars)) {
      sols.push(placed.slice());
      if (placed.length < minLen) short = true;
      return;
    }
    for (const t of new Set(left)) {
      const rest = left.slice();
      rest.splice(rest.indexOf(t), 1);
      for (let o = 0; o < DEFS[t].orients.length; o++) {
        for (const pl of placementsFor(g, t, o)) {
          placed.push(pl);
          dfs(placed, rest);
          placed.pop();
        }
      }
    }
  }
  dfs([], lv.inv.slice());
  return { sols, nodes, short };
}

/**
 * Looks for any winning arrangement, giving up after `budget` positions. True when one is found, false when there is
 * none, null when it gave up. Most random draws have no solution and proving that takes a full search, while a
 * solvable draw usually shows a solution early, so the generator uses this as a cheap first filter.
 */
export function hasSolution(lv: Level, budget: number): boolean | null {
  const seen = new Set<string>();
  let nodes = 0;
  let found = false;
  let cut = false;
  function dfs(placed: Placement[], left: PieceType[]) {
    if (found || cut) return;
    const key = setKey(placed);
    if (seen.has(key)) return;
    seen.add(key);
    if (++nodes > budget) {
      cut = true;
      return;
    }
    const g = makeGrid(lv, placed);
    if (findRoute(g, lv.hero, lv.goal, lv.stars)) {
      found = true;
      return;
    }
    for (const t of new Set(left)) {
      const rest = left.slice();
      rest.splice(rest.indexOf(t), 1);
      for (let o = 0; o < DEFS[t].orients.length; o++) {
        for (const pl of placementsFor(g, t, o)) {
          placed.push(pl);
          dfs(placed, rest);
          placed.pop();
          if (found || cut) return;
        }
      }
    }
  }
  dfs([], lv.inv.slice());
  return found ? true : cut ? null : false;
}
