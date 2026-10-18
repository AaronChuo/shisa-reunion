import { sfx } from '../audio/sfx';
import { speak } from '../audio/speech';
import { type PlaceId, placeSeen } from '../content/places';
import { drawFromSeries, type Series, VARIANT_BY_ID, VARIANTS } from '../content/shisa';
import { SHISA_CHEER } from '../content/story';
import { type IntroKey, PIECE_NAMES } from '../content/text';
import { learnedFor, openFor, planRun, STAGES, stageCfg, ZONES } from '../content/zones';
import { canLift, findRoute, fits, type Grid, makeGrid, type PathStep, type PieceType, placeKey, solve, stable, waterAt } from '../engine';
import { getState, mut, type Run, type Screen } from '../state/store';
import { generateLevel } from './generator';

const run = (): Run => {
  const r = getState().progress.run;
  if (!r) throw new Error('no active run');
  return r;
};

export function gridNow(moves?: number): Grid {
  const r = run();
  if (!r.level) throw new Error('no level');
  return makeGrid(r.level, r.placed, moves ?? r.moves);
}

const heroName = () => VARIANT_BY_ID[getState().progress.pair[0]].name;
const goalName = () => VARIANT_BY_ID[getState().progress.pair[1]].name;

// ---------- speech bubble ----------
let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
export function say(text: string, ms = 1900): void {
  mut((s) => {
    s.ui.bubble = { text, n: (s.ui.bubble?.n ?? 0) + 1 };
  });
  clearTimeout(bubbleTimer);
  if (ms)
    bubbleTimer = setTimeout(
      () =>
        mut((s) => {
          s.ui.bubble = null;
        }),
      ms,
    );
}
export function hush(): void {
  clearTimeout(bubbleTimer);
  mut((s) => {
    s.ui.bubble = null;
  });
}

// ---------- navigation ----------
export function go(screen: Screen): void {
  if (screen === 'home') {
    goHome();
    return;
  }
  mut((s) => {
    s.ui.screen = screen;
    s.ui.modal = null;
    if (screen === 'gacha') s.ui.pull = 'idle';
  });
}

export function goHome(): void {
  hush();
  mut((s) => {
    Object.assign(s.ui, { screen: 'home', modal: null, busy: false, walking: null, cheer: false, sel: -1, hint: null });
  });
}

export function closeModal(): void {
  mut((s) => {
    s.ui.modal = null;
  });
}

export function toggleSound(): void {
  mut((s) => {
    s.progress.sound = !s.progress.sound;
  });
  if (getState().progress.sound) setTimeout(() => sfx.hello(), 60);
}

export function toggleMusic(): void {
  mut((s) => {
    s.progress.music = !s.progress.music;
  });
}

export function openAudioSettings(): void {
  mut((s) => {
    s.ui.modal = { kind: 'audio' };
  });
}

// ---------- runs ----------
export function requestRun(zi: number): void {
  const r = getState().progress.run;
  if (!r || r.phase === 'done') startRun(zi);
  else if (r.zi === zi) resumeRun();
  else
    mut((s) => {
      s.ui.modal = { kind: 'confirmRun', zi };
    });
}

export function startRun(zi: number): void {
  const seed = Math.floor(Math.random() * 1e9);
  mut((s) => {
    s.progress.run = {
      zone: ZONES[zi].id,
      zi,
      si: 0,
      seed,
      plan: planRun(zi, learnedFor(zi, s.progress.clears), seed),
      road: [null, null, null, null, null],
      level: null,
      placed: [],
      moves: 0,
      hist: [],
      orient: [],
      shell: 2,
      conch: 1,
      earned: 0,
      rerolls: 0,
      phase: 'play',
    };
    s.ui.modal = null;
  });
  void buildStage();
}

export function resumeRun(): void {
  const r = getState().progress.run;
  if (!r) return;
  if (r.phase === 'play' && r.level) enterStage();
  else if (r.phase === 'branch' || r.phase === 'choose') {
    mut((s) => {
      s.ui.screen = 'play';
    });
    showBranch();
  } else void buildStage();
}

async function buildStage(): Promise<void> {
  const r = run();
  const cfg = stageCfg(r.zi, r.si, r.plan[r.si] ?? []);
  hush();
  mut((s) => {
    Object.assign(s.ui, { busy: true, screen: 'play', walking: null, picked: [], cheer: false, heroAt: null, hint: null, sel: -1 });
  });
  const loading = setTimeout(
    () =>
      mut((s) => {
        s.ui.modal = { kind: 'loading' };
      }),
    180,
  );
  const lv = await generateLevel(cfg, r.seed + r.si * 1009 + r.rerolls * 7919);
  clearTimeout(loading);
  mut((s) => {
    const cur = s.progress.run;
    if (!cur) return;
    Object.assign(cur, { level: lv, placed: [], moves: 0, hist: [], phase: 'play', orient: lv.inv.map(() => 0) });
  });
  enterStage();
}

function enterStage(): void {
  mut((s) => {
    Object.assign(s.ui, {
      screen: 'play',
      modal: null,
      sel: -1,
      hint: null,
      busy: false,
      justPlaced: -1,
      walking: null,
      picked: [],
      heroAt: null,
      cheer: false,
      coach: !s.progress.seen.includes('coach'),
    });
  });
  showNextIntro();
}

function introQueue(): IntroKey[] {
  const lv = run().level;
  const seen = getState().progress.seen;
  if (!lv) return [];
  const q: IntroKey[] = [];
  for (const t of new Set(lv.inv)) if (!seen.includes(t)) q.push(t);
  if (lv.urchin.length && !seen.includes('urchin')) q.push('urchin');
  if (lv.tide && !seen.includes('tide')) q.push('tide');
  if (lv.gate && !seen.includes('gate')) q.push('gate');
  if (lv.stars.length && !seen.includes('star')) q.push('star');
  return q;
}

function showNextIntro(): void {
  // Arriving somewhere new: its postcard comes first
  const r0 = run();
  if (r0.si === 0 && !getState().progress.seen.includes(placeSeen(r0.zone as PlaceId))) {
    openPlace(r0.zone as PlaceId, null);
    return;
  }
  const q = introQueue();
  if (q.length) {
    mut((s) => {
      s.ui.modal = { kind: 'intro', key: q[0] };
    });
    return;
  }
  closeModal();
  const r = run();
  const stars = r.level?.stars.length ?? 0;
  const starLine = stars ? `，要先撿${stars > 1 ? ` ${stars} 堆` : ''}星砂` : '';
  if (getState().ui.coach) {
    // The very first stage shows a finger dragging the right block to the right spot
    hint(true);
    say(`把積木拖進來，幫${heroName()}${stars ? '先撿星砂，再' : ''}走到${goalName()}身邊`, 0);
  } else if (r.si === STAGES - 1) say(`最後一站：${ZONES[r.zi].boss.name}${starLine}`, stars ? 2600 : 2000);
  else say(`這站要用 ${r.level?.inv.length ?? 0} 塊積木${starLine}`, stars ? 2400 : 1600);
}

export function ackIntro(key: IntroKey): void {
  mut((s) => {
    s.progress.seen.push(key);
  });
  showNextIntro();
}

// ---------- playing ----------
function pushHist(r: Run): void {
  r.hist.push({ placed: r.placed.map((p) => ({ ...p })), moves: r.moves });
  if (r.hist.length > 40) r.hist.shift();
}

export function selectCard(k: number): void {
  mut((s) => {
    s.ui.sel = s.ui.sel === k ? -1 : k;
  });
  if (getState().ui.sel >= 0) say('點一下盤面放下，或直接拖過去');
}

export function clearSelection(): void {
  mut((s) => {
    s.ui.sel = -1;
  });
}

export function rotate(k: number): void {
  if (getState().ui.busy) return;
  mut((s) => {
    const r = s.progress.run;
    if (!r?.level) return;
    const t = r.level.inv[k];
    const n = t === 'stair' ? 4 : 1;
    r.orient[k] = (r.orient[k] + 1) % n;
    if (s.ui.hint?.type === 'put' && s.ui.hint.k === k) s.ui.hint = null;
  });
  sfx.rotate();
}

export function shake(target: string): void {
  mut((s) => {
    s.ui.shake = { target, n: (s.ui.shake?.n ?? 0) + 1 };
  });
}

/** Takes a placed piece off the board because the player started dragging it */
export function liftForDrag(idx: number): void {
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    pushHist(r);
    r.placed.splice(idx, 1);
    s.ui.justPlaced = -1;
    s.ui.hint = null;
    s.ui.sel = -1;
  });
  sfx.lift();
}

/** A tap on a placed piece sends it back to the tray */
export function returnToTray(idx: number): void {
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    pushHist(r);
    const [p] = r.placed.splice(idx, 1);
    r.orient[p.k] = p.o;
    s.ui.justPlaced = -1;
    s.ui.hint = null;
  });
  sfx.lift();
  checkWin();
}

export function canLiftPiece(idx: number): boolean {
  const r = run();
  return !!r.level && canLift(r.level, r.placed, idx);
}

export function place(k: number, t: PieceType, o: number, x: number, y: number, push: boolean): void {
  const before = gridNow();
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    if (push) pushHist(r);
    r.placed.push({ t, o, x, y, k });
    r.moves += 1;
    r.orient[k] = o;
    Object.assign(s.ui, { justPlaced: r.placed.length - 1, sel: -1, hint: null });
    if (s.ui.coach) {
      s.ui.coach = false;
      s.progress.seen.push('coach');
    }
  });
  hush();
  sfx.place(y);
  const after = gridNow();
  if (after.gateOpen && !before.gateOpen) {
    sfx.gate();
    say('石門打開了！', 1500);
  }
  if (after.water > before.water) {
    sfx.tide();
    say('海水漲上來了！', 1500);
  }
  checkWin();
}

export function bad(text: string): void {
  sfx.bad();
  say(text);
}

export function undo(): void {
  const st = getState();
  if (st.ui.busy || !st.progress.run?.hist.length) return;
  mut((s) => {
    const r = s.progress.run;
    const h = r?.hist.pop();
    if (!r || !h) return;
    r.placed = h.placed;
    r.moves = h.moves;
    Object.assign(s.ui, { hint: null, justPlaced: -1, sel: -1 });
  });
  sfx.lift();
}

export function reset(): void {
  const st = getState();
  const r0 = st.progress.run;
  if (st.ui.busy || !r0 || (!r0.placed.length && !r0.moves)) return;
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    pushHist(r);
    r.placed = [];
    r.moves = 0;
    Object.assign(s.ui, { hint: null, justPlaced: -1, sel: -1 });
  });
  sfx.lift();
}

function checkWin(): void {
  const r = run();
  if (!r.level) return;
  const path = findRoute(gridNow(), r.level.hero, r.level.goal, r.level.stars);
  if (!path) return;
  mut((s) => {
    s.ui.busy = true;
  });
  hush();
  setTimeout(
    () =>
      mut((s) => {
        s.ui.walking = path as PathStep[];
      }),
    380,
  );
}

/** Called by the board as the hero scoops up a star sand on the way */
export function pickStar(i: number): void {
  mut((s) => {
    if (!s.ui.picked.includes(i)) s.ui.picked.push(i);
  });
  sfx.star();
}

/** Called by the board once the hero has walked over to the goal */
export function walkDone(at: { x: number; y: number; flip: boolean }): void {
  mut((s) => {
    s.ui.walking = null;
    s.ui.heroAt = at;
    s.ui.cheer = true;
  });
  sfx.win();
  setTimeout(onWin, 800);
}

function onWin(): void {
  const last = run().si === STAGES - 1;
  mut((s) => {
    const cur = s.progress.run;
    if (!cur) return;
    s.progress.tokens += 1;
    cur.earned += 1;
    cur.phase = last ? 'done' : 'branch';
    if (last) {
      s.progress.clears[cur.zone] = (s.progress.clears[cur.zone] ?? 0) + 1;
      const was = s.progress.open;
      cur.opened = openFor(s.progress.clears).filter((id) => !was.includes(id));
      s.progress.open = ZONES.map((Z) => Z.id).filter((id) => was.includes(id) || cur.opened?.includes(id));
    }
    s.ui.modal = { kind: 'win', last };
  });
  sfx.coin();
  if (getState().progress.sound) speak(SHISA_CHEER, undefined, 'shisa');
}

export function afterWin(): void {
  if (run().phase === 'done') finishRun();
  else showBranch();
}

export function showBranch(): void {
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    if (r.phase === 'branch') {
      r.si += 1;
      r.phase = 'choose';
    }
    s.ui.modal = { kind: 'branch' };
  });
}

/** Sets off for the stop shown on the "next stop" card, along road `road` when there was a choice */
export function goNextStop(road: number | null = null): void {
  sfx.hello();
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    r.road[r.si] = road;
    r.rerolls = 0;
    s.ui.modal = null;
  });
  void buildStage();
}

function finishRun(): void {
  const r = run();
  const unlocked = (r.opened ?? []).map((id) => ZONES.findIndex((Z) => Z.id === id)).filter((i) => i >= 0);
  mut((s) => {
    s.progress.run = null;
    s.ui.busy = false;
    s.ui.modal = { kind: 'done', zi: r.zi, earned: r.earned, unlocked };
  });
}

// ---------- hint & reroll ----------
let solCache: { level: unknown; sols: ReturnType<typeof solve>['sols'] } | null = null;

/** Shows the next step of a solution. `free` is the first-level demonstration, which costs no hint shell. */
export function hint(free = false): void {
  const st = getState();
  const r = st.progress.run;
  if (st.ui.busy || !r?.level || (!free && r.shell <= 0)) return;
  const cost = free ? 0 : 1;
  const lv = r.level;
  if (solCache?.level !== lv) solCache = { level: lv, sols: solve(lv, 60).sols };
  const sols = solCache.sols;
  if (!sols.length) return;
  const have = r.placed.map(placeKey);
  let best = sols[0];
  let bestN = -1;
  for (const sol of sols) {
    const keys = new Set(sol.map(placeKey));
    const n = have.filter((k) => keys.has(k)).length;
    if (n > bestN) {
      bestN = n;
      best = sol;
    }
  }
  const want = new Set(best.map(placeKey));
  const wrong = r.placed.map((_, i) => i).filter((i) => !want.has(have[i]));
  if (lv.tide && !wrong.length && waterAt(lv, r.moves + best.length - bestN) > waterAt(lv, best.length)) {
    say('海水漲太高了，按「重來」讓海水退回去', 3000);
    return;
  }
  if (wrong.length) {
    const pi = wrong.find((i) => canLift(lv, r.placed, i)) ?? wrong[0];
    mut((s) => {
      if (s.progress.run) s.progress.run.shell -= cost;
      s.ui.hint = { type: 'lift', pi };
    });
    say('先把發亮的這塊拿下來', 2400);
    return;
  }
  const g = gridNow();
  const haveSet = new Set(have);
  const miss = best.filter((p) => !haveSet.has(placeKey(p)));
  const p = miss.find((q) => fits(g, q.t, q.o, q.x, q.y) && (q.y === 0 || !fits(g, q.t, q.o, q.x, q.y - 1)) && stable(g, q.t, q.o, q.x, q.y)) ?? miss[0];
  if (!p) return;
  const k = lv.inv.findIndex((t, i) => t === p.t && !r.placed.some((q) => q.k === i));
  mut((s) => {
    const cur = s.progress.run;
    if (!cur) return;
    cur.shell -= cost;
    if (k >= 0) cur.orient[k] = p.o;
    s.ui.hint = { type: 'put', p, k };
  });
  say(`把發亮的${PIECE_NAMES[p.t]}放到虛線那裡`, 2600);
}

export function reroll(): void {
  const st = getState();
  if (st.ui.busy || !st.progress.run || st.progress.run.conch <= 0) return;
  mut((s) => {
    const r = s.progress.run;
    if (!r) return;
    r.conch -= 1;
    r.rerolls += 1;
  });
  sfx.pop();
  void buildStage();
}

// ---------- gacha & collection ----------
const leftIn = (series: Series['id'], owned: readonly string[]) => VARIANTS.filter((v) => v.series === series && !owned.includes(v.id)).length;

/** A coin goes into the slot and the crank unlocks. The coin is only spent when a capsule actually comes out. */
export function insertCoin(): boolean {
  const st = getState();
  if (st.ui.pull !== 'idle' || st.progress.tokens < 1 || !leftIn(st.ui.gseries, st.progress.owned)) return false;
  mut((s) => {
    s.ui.pull = 'ready';
  });
  sfx.coinIn();
  return true;
}

/** The main button turns the crank by itself, for children who can't turn it yet */
export function autoTurn(): void {
  if (getState().ui.pull !== 'ready') return;
  mut((s) => {
    s.ui.spin += 1;
  });
}

/**
 * A full turn of the crank: the shisa is drawn by the fair rule (never a duplicate, rare ones less often) and the
 * capsule that physically fell out carries it. Returns the shisa id, or null when no coin is in.
 */
export function releaseCapsule(color: string): string | null {
  const st = getState();
  if (st.ui.pull !== 'ready' || st.progress.tokens < 1) return null;
  const got = drawFromSeries(st.ui.gseries, st.progress.owned);
  if (!got) return null;
  mut((s) => {
    s.progress.tokens -= 1;
    s.progress.owned.push(got.id);
    s.ui.pull = 'drop';
    s.ui.pulled = got.id;
    s.ui.capColor = color;
  });
  sfx.crank();
  return got.id;
}

/** The capsule has rolled down the chute into the tray */
export function capsuleOut(): void {
  if (getState().ui.pull !== 'drop') return;
  mut((s) => {
    s.ui.pull = 'out';
  });
  sfx.thunk();
}

export function openCapsule(): void {
  const { ui } = getState();
  const v = ui.pulled ? VARIANT_BY_ID[ui.pulled] : null;
  if (ui.pull !== 'out' || !v) return;
  sfx.pop();
  mut((s) => {
    s.ui.modal = { kind: 'reveal', id: v.id, series: v.series, color: ui.capColor ?? '#E2703A' };
  });
}

/** After a capsule opens: keep the new shisa, or send it out right away as the one that sets out */
export function finishReveal(next: 'keep' | 'use'): void {
  const id = getState().ui.pulled;
  mut((s) => {
    s.ui.pull = 'idle';
    s.ui.pulled = null;
    s.ui.capColor = null;
    s.ui.modal = null;
  });
  if (next === 'use' && id) chooseRole(id, 0);
}

// ---------- postcards ----------
/**
 * Shows a place's postcard. `start` is the zone to set off for from it (opened from the map), or null when it is read
 * on arrival. Reading it puts it in the collection, except for zones still locked.
 */
export function openPlace(id: PlaceId, start: number | null): void {
  mut((s) => {
    s.ui.modal = { kind: 'place', id, start };
    const zone = ZONES.find((Z) => Z.id === id);
    const locked = zone && !s.progress.open.includes(zone.id);
    if (!locked && !s.progress.seen.includes(placeSeen(id))) s.progress.seen.push(placeSeen(id));
  });
}

export function openCredits(): void {
  mut((s) => {
    s.ui.modal = { kind: 'credits' };
  });
}

/** Done reading: on arrival, carry on into the stage's new-block cards; otherwise just close */
export function ackPlace(): void {
  const st = getState();
  const r = st.progress.run;
  if (st.ui.screen === 'play' && r?.phase === 'play' && r.level) showNextIntro();
  else closeModal();
}

/** "出發" on a postcard opened from the map */
export function setOffFrom(zi: number): void {
  closeModal();
  requestRun(zi);
}

// ---------- the opening story ----------
export function openStory(): void {
  hush();
  mut((s) => {
    s.ui.story = true;
    s.ui.modal = null;
  });
}

/** Leaves the story; `go` sets straight off on the next journey (or carries on the unfinished one) */
export function closeStory(go: boolean, zi: number): void {
  mut((s) => {
    s.ui.story = false;
    if (!s.progress.seen.includes('story')) s.progress.seen.push('story');
  });
  if (!go) return;
  const r = getState().progress.run;
  if (r && r.phase !== 'done') resumeRun();
  else startRun(zi);
}

/** Back to playing: carry on the unfinished journey, or open the map to pick one */
export function goPlay(): void {
  const r = getState().progress.run;
  if (r && r.phase !== 'done') resumeRun();
  else goHome();
}

/** Switching machines is fine before the crank turns; a coin already in the slot comes back */
export function setSeries(id: Series['id']): void {
  const p = getState().ui.pull;
  if (p !== 'idle' && p !== 'ready') return;
  mut((s) => {
    s.ui.gseries = id;
    s.ui.pull = 'idle';
  });
}

export function openAbout(): void {
  mut((s) => {
    s.ui.modal = { kind: 'about' };
  });
}

export function askRole(id: string): void {
  mut((s) => {
    s.ui.modal = { kind: 'role', id };
  });
}

/** role 0 = the one that sets out (open mouth), 1 = the one waiting (closed mouth) */
export function chooseRole(id: string, role: 0 | 1): void {
  mut((s) => {
    const pair = s.progress.pair;
    const other = role === 0 ? 1 : 0;
    if (pair[other] === id) pair[other] = pair[role];
    pair[role] = id;
    s.ui.modal = null;
  });
  sfx.hello();
}
