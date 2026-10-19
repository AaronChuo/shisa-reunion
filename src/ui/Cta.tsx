import type { ReactNode } from 'react';
import { TapHand } from '../art/Icons';
import { ageOf } from '../content/age';
import { useGame } from '../state/store';
import { useIdle } from './useIdle';

/** How long a child can sit still before a finger pops up to point at the main button; depends on who is playing */
export const useNudgeMs = (): number | null => useGame((s) => ageOf(s.progress.age).nudgeMs);

/**
 * The one main "next step" on a screen: big, orange, gently breathing, with a picture in a white circle so a child
 * who can't read yet still knows to press it. After a few idle seconds a finger points at it.
 */
export function Cta({
  icon,
  children,
  onClick,
  disabled,
  wide,
  id,
  data,
  nudge = true,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
  id?: string;
  /** Extra attributes such as data-next used by tests and focus handling */
  data?: Record<string, string | boolean>;
  /** Off where something else on screen already shows a finger, so a child only ever sees one */
  nudge?: boolean;
}) {
  const idle = useIdle(useNudgeMs());
  return (
    <button type="button" id={id} className={wide ? 'cta wide' : 'cta'} disabled={disabled} onClick={onClick} {...data}>
      <span className="ci">{icon}</span>
      <span className="cl">{children}</span>
      {nudge && idle && !disabled && <TapHand />}
    </button>
  );
}
