import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
import { Icon } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { AGE_ORDER, AGES, type Age } from '../content/age';
import { VARIANT_BY_ID } from '../content/shisa';
import { closeModal } from '../game/actions';
import { chooseAge, openParents } from '../game/family';
import { useGame } from '../state/store';
import { Cta } from '../ui/Cta';
import { Sheet } from './Sheet';

// The grown-ups' corner, behind a button that has to be held, and the question that sets it up: who is playing.

const HOLD_MS = 1500;

/**
 * Opens the grown-ups' settings only after being held down for a moment, so a tapping child doesn't wander in;
 * the keyboard opens it straight away.
 */
export function ParentsButton() {
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const stop = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };
  const start = (e: ReactPointerEvent) => {
    e.preventDefault();
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      openParents();
    }, HOLD_MS);
  };
  return (
    <button
      type="button"
      id="parentsBtn"
      className={holding ? 'holdBtn holding' : 'holdBtn'}
      style={{ ['--hold' as string]: `${HOLD_MS}ms` }}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openParents();
        }
      }}
    >
      <Icon name="lock" />
      <span>大人設定（按住不放）</span>
    </button>
  );
}

/** The pair's first shisa, small to big, standing for the three ages */
function AgeArt({ scale }: { scale: number }) {
  const hero = VARIANT_BY_ID[useGame((s) => s.progress.pair[0])];
  return (
    <svg className="ageArt" viewBox="-40 -84 80 88" aria-hidden="true">
      <g transform={`translate(0,0) scale(${scale})`}>
        <ShisaArt v={hero} open />
      </g>
    </svg>
  );
}

const AGE_SCALE: Record<Age, number> = { little: 0.55, kid: 0.75, big: 0.95 };

function AgeChoices({ value, onPick, big }: { value: Age | null; onPick: (a: Age) => void; big?: boolean }) {
  return (
    <fieldset className={big ? 'ageCards big' : 'ageCards'} aria-label="誰在玩">
      {AGE_ORDER.map((a) => (
        <button key={a} type="button" aria-pressed={value === a} className={value === a ? 'ageCard on' : 'ageCard'} data-age={a} onClick={() => onPick(a)}>
          {big && <AgeArt scale={AGE_SCALE[a]} />}
          <b>{AGES[a].label}</b>
        </button>
      ))}
    </fieldset>
  );
}

/** Asked once on the map: a grown-up says who is playing, which sets how much the game helps */
export function AgeAsk() {
  return (
    <Sheet label="誰要來玩" wide>
      {/* Focus lands on the question, so no card looks chosen before anyone has chosen */}
      <h2 tabIndex={-1} data-focus>
        誰要來玩？
      </h2>
      <p>請大人幫忙選。年紀小，手指會常常出來示範。</p>
      <AgeChoices value={null} onPick={chooseAge} big />
      <p className="small">之後可以在「聲音設定」裡按住「大人設定」改。</p>
    </Sheet>
  );
}

/** Who is playing */
export function ParentSettings() {
  const age = useGame((s) => s.progress.age);
  return (
    <Sheet label="大人設定" wide>
      <h2>大人設定</h2>
      <div className="setting">
        <h3>誰在玩</h3>
        <AgeChoices value={age} onPick={chooseAge} />
        <p className="small">{age ? AGES[age].detail : '還沒選；先照 3–5 歲的方式幫忙'}</p>
      </div>
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-focus': true }} nudge={false} onClick={closeModal}>
          好了
        </Cta>
      </div>
    </Sheet>
  );
}
