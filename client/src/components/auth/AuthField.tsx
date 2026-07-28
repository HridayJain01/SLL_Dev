import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Label + 32px outlined input, the field unit repeated down both auth forms. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <label className="flex w-full flex-col">
      <span className="font-heading text-[16px] font-bold leading-[22px] text-black">{label}</span>
      <input
        ref={ref}
        className={`mt-[4px] h-[32px] w-full rounded-[10px] border border-black bg-white px-[10px] font-body text-[10px] font-medium text-black outline-none transition-shadow placeholder:text-black focus:ring-2 focus:ring-primary/40 ${className}`}
        {...props}
      />
      {error && <span className="mt-[3px] font-body text-[10px] font-medium text-danger">{error}</span>}
    </label>
  ),
);
AuthField.displayName = 'AuthField';

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center font-heading text-[48px] font-extrabold leading-[52.5px] text-black">{title}</h2>
      <p className="mt-[10.5px] w-full max-w-[340px] text-center font-body text-[15.2px] font-normal leading-[25.08px] text-[#6b6f85]">
        {subtitle}
      </p>
    </div>
  );
}

export function AuthSubmit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-[48px] w-full rounded-full bg-primary font-body text-[14px] font-medium leading-[20px] tracking-[-0.1504px] text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
