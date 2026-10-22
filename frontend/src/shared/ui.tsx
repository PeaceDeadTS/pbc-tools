import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const controlClass =
  'w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'ghost';
};

export function buttonClass(tone: 'primary' | 'ghost' = 'primary', className?: string): string {
  return cx(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
    tone === 'primary' ? 'bg-accent text-accent-ink hover:bg-accent/90' : 'border border-line bg-card text-ink hover:bg-paper',
    className,
  );
}

export function Button({ tone = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(tone, className)} {...props} />;
}

function HintBubble({ id, hint }: { id: string; hint: string }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble) return;
    const anchor = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - anchor.bottom;
    const spaceAbove = anchor.top;
    setAbove(spaceBelow < bubble.offsetHeight + 16 && spaceAbove > spaceBelow);
  }, [open, hint]);

  return (
    <span ref={rootRef} className={cx('relative shrink-0', open && 'z-[1]')}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-hint`}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          'grid h-5 w-5 cursor-pointer place-items-center rounded-full border text-xs',
          open
            ? 'border-accent bg-accent text-accent-ink'
            : 'border-line bg-card text-muted hover:border-accent/50 hover:text-ink',
        )}
      >
        ?
      </button>
      {open ? (
        <div
          ref={bubbleRef}
          id={`${id}-hint`}
          role="note"
          onClick={() => setOpen(false)}
          className={cx(
            'absolute right-0 z-[1] w-80 max-w-[min(22rem,calc(100vw-2rem))] cursor-pointer',
            above ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          <span
            aria-hidden
            className={cx(
              'pointer-events-none absolute right-1 size-3 rotate-45 border-accent bg-card',
              above ? '-bottom-[5px] border-r-2 border-b-2' : '-top-[5px] border-t-2 border-l-2',
            )}
          />
          <div className="max-h-[min(24rem,calc(100vh-5rem))] overflow-x-hidden overflow-y-auto rounded-2xl border-2 border-accent bg-card px-3.5 py-3 text-left text-sm leading-relaxed text-ink shadow-[0_12px_32px_rgba(28,25,22,0.16)]">
            {hint}
          </div>
        </div>
      ) : null}
    </span>
  );
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? <HintBubble id={id} hint={hint} /> : null}
      </div>
      {children}
    </div>
  );
}

export function TextInput({ id, value, onChange, required }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      className={controlClass}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function NumberInput({ id, value, onChange, required, min = 0 }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: number;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      step={1}
      required={required}
      className={controlClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
          event.preventDefault();
        }
      }}
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      className={controlClass}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

export function Panel({ title, children, className }: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-xl border border-line bg-card p-4', className)}>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-3 text-sm text-ink">
      {code}
    </pre>
  );
}
