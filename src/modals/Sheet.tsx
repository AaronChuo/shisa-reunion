import { type ReactNode, useEffect, useRef } from 'react';

/** A modal card; its first [data-focus] button (or else its first button) takes the focus */
export function Sheet({ children, wide, label, enter = 'pop' }: { children: ReactNode; wide?: boolean; label: string; enter?: 'pop' | 'none' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-focus]') ?? ref.current?.querySelector<HTMLElement>('button');
    el?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={ref}
      className={['sheet', wide && 'wide', enter === 'none' && 'still'].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {children}
    </div>
  );
}

/** An on/off row: picture, name, one line of detail, and a knob that says 開 or 關 */
export function Switch({
  id,
  on,
  icon,
  label,
  detail,
  onToggle,
}: {
  id: string;
  on: boolean;
  icon: ReactNode;
  label: string;
  detail: string;
  onToggle: () => void;
}) {
  return (
    <button type="button" className={on ? 'switch on' : 'switch'} id={id} role="switch" aria-checked={on} onClick={onToggle}>
      <span className="switchIcon">{icon}</span>
      <span className="switchText">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <span className="knob" aria-hidden="true">
        {on ? '開' : '關'}
      </span>
    </button>
  );
}
