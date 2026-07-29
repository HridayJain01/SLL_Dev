import { cn } from '@/lib/utils';

/** Card shell shared by the account screens — Figma node 380:254. */
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[24px] bg-white p-[28px] drop-shadow-[0px_2px_6px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-[16px] font-extrabold leading-[24px] text-night">{children}</h2>
  );
}

/** Page title + subtitle block used at the top of every account screen. */
export function AccountPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-[36px] font-extrabold leading-[40px] text-night">{title}</h1>
        {subtitle && (
          <p className="pt-[4px] font-body text-[16px] leading-[20px] text-slate-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/** Pill button in the lagoon accent, used for the primary action on a card. */
export function AccountButton({
  children,
  onClick,
  type = 'button',
  disabled,
  tone = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  tone?: 'primary' | 'outline' | 'danger';
  className?: string;
}) {
  const tones = {
    primary: 'bg-lagoon-deep text-white hover:bg-lagoon-darkest disabled:bg-[#d1d5db]',
    outline:
      'border border-[#e5e7eb] bg-white text-night hover:border-lagoon-deep hover:text-lagoon-deep disabled:text-[#9ca3af]',
    danger: 'border border-[#ef4444] bg-white text-[#ef4444] hover:bg-[#ef4444]/5',
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'shrink-0 rounded-full px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] transition-colors disabled:cursor-not-allowed',
        tones[tone],
        className
      )}
    >
      {children}
    </button>
  );
}

/** Empty-state block for lists that have nothing in them yet. */
export function AccountEmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-[10px] rounded-[20px] border-2 border-dashed border-[#e5e7eb] px-6 py-[48px] text-center">
      <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-[#f3f4f6] text-slate-muted">
        {icon}
      </span>
      <p className="font-heading text-[16px] font-bold leading-[24px] text-night">{title}</p>
      {body && (
        <p className="max-w-[420px] font-body text-[14px] leading-[20px] text-slate-muted">{body}</p>
      )}
      {action}
    </div>
  );
}
