import type { ReactNode } from 'react';

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? 'h-4 w-4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <Svg className={className ?? 'h-10 w-10'}>
      <path d="M12 16V5" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </Svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4v11" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19h14" />
    </Svg>
  );
}

export function IconRotate({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </Svg>
  );
}
