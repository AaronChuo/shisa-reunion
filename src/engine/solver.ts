import { makeGrid, placementsFor } from './grid';
import { findRoute } from './path';
import { DEFS } from './pieces';
import type { Level, PieceType, Placement } from './types';

export const placeKey = (p: Placement): string => `${p.t}${p.o}@${p.x},${p.y}`;

/** All winning arrangements reachable from the start, in placement order; a branch stops as soon as it wins */
export function solve(lv: Level, cap = 400): { sols: Placement[][]; nodes: number } {
  const seen = new Set<string>();
  const sols: Placement[][] = [];
  let nodes = 0;
  function dfs(placed: Placement[], left: PieceType[]) {
    if (sols.length >= cap) return;
    const key = placed.map(placeKey).sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    nodes++;
    const g = makeGrid(lv, placed);
    if (findRoute(g, lv.hero, lv.goal, lv.stars)) {
      sols.push(placed.slice());
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
  return { sols, nodes };
}
