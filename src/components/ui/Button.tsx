import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-azul text-white shadow-[0_12px_35px_rgba(79,140,255,0.25)] hover:brightness-110',
  secondary:
    'bg-folha border border-regua text-tinta hover:border-azul',
  ghost: 'text-tinta-suave hover:text-tinta',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ href, variant = 'primary', className = '', children }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </Link>
  );
}
