import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, className = '', elevated = false, ...props }: CardProps) {
  return (
    <div className={`${elevated ? 'glass-panel' : 'glass-card'} p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-regua bg-folha-2 px-3 py-1.5 text-xs font-extrabold tracking-wide text-tinta-suave ${className}`}
    >
      {children}
    </span>
  );
}
