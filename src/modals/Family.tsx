import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
import { Icon } from '../art/Icons';
import { ShisaArt } from '../art/Shisa';
import { AGE_ORDER, AGES, type Age, REST_CHOICES } from '../content/age';
import { VARIANT_BY_ID } from '../content/shisa';
import { closeModal } from '../game/actions';
import { ackRest, answerAge, chooseAge, openParents, restoreProgress, setRestMin } from '../game/family';
import { decodeBackup, encodeBackup, summary } from '../state/backup';
import { getState, type Progress, useGame } from '../state/store';
import { Cta } from '../ui/Cta';
import { Sheet } from './Sheet';

// The grown-ups' corner: who is playing, the rest reminder and progress backups, behind a button that has to be held,
// plus the two things the game shows a child because of them: the age question and the rest reminder.

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

/** Asked the first time the game opens: a grown-up says who is playing, which sets how much the game helps */
export function AgeAsk() {
  return (
    <Sheet label="誰要來玩" wide>
      {/* Focus lands on the question, so no card looks chosen before anyone has chosen */}
      <h2 tabIndex={-1} data-focus>
        誰要來玩？
      </h2>
      <p>請大人幫忙選。年紀越小，提示和換題越多，手指也會常常出來示範。</p>
      <AgeChoices value={null} onPick={answerAge} big />
      <p className="small">之後可以在「聲音設定」裡按住「大人設定」改。</p>
    </Sheet>
  );
}

const restLabel = (m: number | null) => (m === null ? '不提醒' : `${m} 分鐘`);

/** Who is playing, the rest reminder, and progress backups */
export function ParentSettings() {
  const age = useGame((s) => s.progress.age);
  const restMin = useGame((s) => s.progress.restMin);
  const [view, setView] = useState<'main' | 'save' | 'load'>('main');
  if (view === 'save') return <SaveBackup back={() => setView('main')} />;
  if (view === 'load') return <LoadBackup back={() => setView('main')} />;
  return (
    <Sheet label="大人設定" wide>
      <h2>大人設定</h2>
      <div className="setting">
        <h3>誰在玩</h3>
        <AgeChoices value={age} onPick={chooseAge} />
        <p className="small">{age ? AGES[age].detail : '還沒選；先照未滿 6 歲的方式幫忙'}</p>
      </div>
      <div className="setting">
        <h3>休息提醒</h3>
        <fieldset className="chips" aria-label="休息提醒">
          {REST_CHOICES.map((m) => (
            <button
              key={String(m)}
              type="button"
              aria-pressed={restMin === m}
              className={restMin === m ? 'chip on' : 'chip'}
              data-rest={m ?? 'off'}
              onClick={() => setRestMin(m)}
            >
              {restLabel(m)}
            </button>
          ))}
        </fieldset>
        <p className="small">玩到這個時間，會在過關後或回到地圖時，請西薩提醒休息一下。</p>
      </div>
      <div className="setting">
        <h3>進度備份</h3>
        <p className="small">進度只存在這台裝置上。換裝置、清掉網站資料或刪掉主畫面的圖示之前，先備份一份。</p>
        <div className="btns">
          <button type="button" className="iconBtn" id="saveBackupBtn" onClick={() => setView('save')}>
            <Icon name="book" />
            <span>備份進度</span>
          </button>
          <button type="button" className="iconBtn" id="loadBackupBtn" onClick={() => setView('load')}>
            <Icon name="refresh" />
            <span>還原進度</span>
          </button>
        </div>
      </div>
      <div className="btns">
        <Cta icon={<Icon name="check" />} data={{ 'data-focus': true }} nudge={false} onClick={closeModal}>
          好了
        </Cta>
      </div>
    </Sheet>
  );
}

const progressLine = (p: Progress) => {
  const s = summary(p);
  return `收集 ${s.owned} 隻西薩、福氣幣 ${s.tokens} 枚、走完過 ${s.zones} 區`;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** The code for this device's progress, to copy or keep as a file */
function SaveBackup({ back }: { back: () => void }) {
  const p = getState().progress;
  const code = encodeBackup(p);
  const box = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => setCopied(true),
      () => box.current?.select(),
    );
  };
  // A file made only when asked for, and let go of right after
  const saveFile = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `西薩搭搭路備份-${today()}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Sheet label="備份進度" wide>
      <h2>備份進度</h2>
      <p>{progressLine(p)}</p>
      <textarea id="backupCode" ref={box} className="codeBox" readOnly value={code} rows={4} onFocus={(e) => e.currentTarget.select()} />
      <div className="btns">
        <button type="button" className="iconBtn" id="copyBackupBtn" onClick={copy}>
          <Icon name="check" />
          <span>{copied ? '複製好了' : '複製'}</span>
        </button>
        <button type="button" className="iconBtn" id="fileBackupBtn" onClick={saveFile}>
          <Icon name="book" />
          <span>存成檔案</span>
        </button>
      </div>
      <p className="small">把這串文字貼到新裝置的「還原進度」，就能接著玩。</p>
      <button type="button" className="linkBtn" onClick={back}>
        回大人設定
      </button>
    </Sheet>
  );
}

/** Paste a code or open a backup file, check what it holds, then replace this device's progress with it */
function LoadBackup({ back }: { back: () => void }) {
  const [text, setText] = useState('');
  const [found, setFound] = useState<Progress | null>(null);
  const [bad, setBad] = useState(false);
  const check = (t: string) => {
    const p = decodeBackup(t);
    setFound(p);
    setBad(!p);
  };
  const openFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      setText(t);
      check(t);
    });
  };
  return (
    <Sheet label="還原進度" wide>
      <h2>還原進度</h2>
      <p>貼上備份的文字，或選備份檔。</p>
      <textarea
        id="restoreCode"
        className="codeBox"
        rows={4}
        value={text}
        placeholder="SHISA1-…"
        onChange={(e) => {
          setText(e.target.value);
          setFound(null);
          setBad(false);
        }}
      />
      <div className="btns">
        <label className="iconBtn" htmlFor="restoreFile">
          <Icon name="book" />
          <span>選備份檔</span>
        </label>
        <input id="restoreFile" type="file" accept=".txt,text/plain" hidden onChange={openFile} />
        <button type="button" className="iconBtn" id="checkBackupBtn" disabled={!text.trim()} onClick={() => check(text)}>
          <Icon name="check" />
          <span>看看內容</span>
        </button>
      </div>
      {bad && (
        <p className="warn" id="backupBad">
          這不是完整的備份，請整串重新複製一次。
        </p>
      )}
      {found && (
        <div className="confirm" id="backupFound">
          <p>
            備份裡：{progressLine(found)}
            <br />
            這台裝置現在：{progressLine(getState().progress)}
          </p>
          <p className="small">還原會用備份取代這台裝置現在的進度。</p>
          <Cta icon={<Icon name="refresh" />} id="restoreBtn" nudge={false} onClick={() => restoreProgress(found)}>
            用備份取代
          </Cta>
        </div>
      )}
      <button type="button" className="linkBtn" onClick={back}>
        回大人設定
      </button>
    </Sheet>
  );
}

/** After a long while of play, at a break: the shisa asks for a rest */
export function RestReminder() {
  const pair = useGame((s) => s.progress.pair);
  return (
    <Sheet label="休息一下">
      <svg className="restArt" viewBox="-60 -100 130 104" aria-hidden="true">
        <g transform="translate(-26,0)">
          <ShisaArt v={VARIANT_BY_ID[pair[0]]} open={false} />
        </g>
        <g transform="translate(34,0)">
          <ShisaArt v={VARIANT_BY_ID[pair[1]]} open={false} />
        </g>
      </svg>
      <h2>玩了好久囉</h2>
      <p>讓眼睛和小手休息一下，喝口水，等一下再來幫西薩搭路吧！</p>
      <div className="btns">
        <Cta icon={<Icon name="map" />} data={{ 'data-focus': true }} onClick={ackRest}>
          好，休息一下
        </Cta>
      </div>
    </Sheet>
  );
}
