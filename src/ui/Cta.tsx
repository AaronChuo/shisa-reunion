import type { ReactNode } from 'react';
import { TapHand } from '../art/Icons';
import { useIdle } from './useIdle';

/** How long a child can sit still before a finger pops up to point at the main button */
export const NUDGE_MS = 4500;

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
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
  id?: string;
  /** Extra attributes such as data-next used by tests and focus handling */
  data?: Record<string, string | boolean>;
}) {
  const idle = useIdle(NUDGE_MS);
  return (
    <button type="button" id={id} className={wide ? 'cta wide' : 'cta'} disabled={disabled} onClick={onClick} {...data}>
      <span className="ci">{icon}</span>
      <span className="cl">{children}</span>
      {idle && !disabled && <TapHand />}
    </button>
  );
}
