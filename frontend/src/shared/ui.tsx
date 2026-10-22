import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';

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
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-hint`}
            onClick={() => setOpen((value) => !value)}
            className="grid h-5 w-5 place-items-center rounded-full border border-line text-xs text-muted hover:text-ink"
          >
            ?
          </button>
        ) : null}
      </div>
      {children}
      {open && hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
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
