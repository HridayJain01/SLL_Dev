import { Link } from 'react-router-dom';
import { MapPin, CircleCheck } from 'lucide-react';

export type BoxSummaryCardProps = {
  planLabel: string;
  planSubtitle: string;
  booksSelected: number;
  bookLimit: number;
  onCheckout: () => void;
  /**
   * "pill" matches the My Box frame (383:1749) — a 288px card with fully
   * rounded buttons and a pill-shaped WhatsApp note. "soft" matches the Cart
   * frame (385:2659) — a 372px card, 14px radius buttons, and a note with a
   * check icon. Both keep the action stack at the designed 246px, centred.
   */
  variant?: 'pill' | 'soft';
  /** Why checkout is unavailable, or how much of the plan is already spent. */
  notice?: string | null;
  checkoutDisabled?: boolean;
  checkoutLabel?: string;
};

/**
 * Right-hand plan summary — Figma nodes 383:1749 (My Box) and 385:2659 (Cart).
 */
export default function BoxSummaryCard({
  planLabel,
  planSubtitle,
  booksSelected,
  bookLimit,
  onCheckout,
  variant = 'pill',
  notice,
  checkoutDisabled = false,
  checkoutLabel = 'Proceed to Checkout',
}: BoxSummaryCardProps) {
  const slotsRemaining = Math.max(0, bookLimit - booksSelected);
  const filled = bookLimit > 0 ? Math.min(100, (booksSelected / bookLimit) * 100) : 0;
  const buttonRadius = variant === 'pill' ? 'rounded-full' : 'rounded-[14px]';
  /* Full-bleed on phones, the designed fixed width once there is room beside
     the box contents. */
  const cardWidth = variant === 'pill' ? 'w-full lg:w-[288px]' : 'w-full sm:w-[372px]';

  return (
    <div
      className={`${cardWidth} max-w-full overflow-hidden rounded-[16px] border border-black/[0.07] bg-white p-px shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]`}
    >
      {/* Plan header */}
      <div className="bg-cerulean px-[20px] py-[16px]">
        <p className="font-jakarta text-[10px] font-bold uppercase leading-[15px] tracking-[0.5px] text-white/70">
          Your Plan
        </p>
        <p className="font-heading text-[18px] font-black leading-[22.5px] text-white">{planLabel}</p>
        <p className="mt-[4px] font-jakarta text-[12px] font-semibold leading-[16px] text-white/80">
          {planSubtitle}
        </p>
      </div>

      <div className="p-[20px]">
        {/* Books selected */}
        <div className="flex items-center justify-between">
          <p className="font-jakarta text-[12px] font-bold leading-[16px] text-night">Books selected</p>
          <p className="font-jakarta text-[12px] font-bold leading-[16px] text-lagoon">
            {booksSelected} of {bookLimit}
          </p>
        </div>
        <div className="mt-[8px] h-[10px] overflow-hidden rounded-full bg-sand">
          <div className="h-[10px] rounded-full bg-lagoon" style={{ width: `${filled}%` }} />
        </div>
        <p className="mt-[6px] font-jakarta text-[11px] font-medium leading-[16.5px] text-clay">
          {slotsRemaining} {slotsRemaining === 1 ? 'slot' : 'slots'} remaining
        </p>
        {notice && (
          <p className="mt-[6px] font-jakarta text-[11px] font-medium leading-[16.5px] text-primary">
            {notice}
          </p>
        )}

        <div className="mt-[20px] border-t border-black/[0.07]" />

        {/* Delivery */}
        <div className="pt-[20px]">
          <p className="font-jakarta text-[12px] font-bold leading-[16px] text-night">Delivery</p>
          <div className="flex items-center justify-between pt-[10px]">
            <span className="flex items-center gap-[6px] font-jakarta text-[12px] leading-[16px] text-clay">
              <MapPin className="h-[12px] w-[12px]" strokeWidth={1.5} />
              Estimated arrival
            </span>
            <span className="font-jakarta text-[12px] font-semibold leading-[16px] text-night">
              3–5 business days
            </span>
          </div>
          <div className="flex items-center justify-between pt-[10px]">
            <span className="font-jakarta text-[12px] leading-[16px] text-clay">Delivery cost</span>
            <span className="font-jakarta text-[12px] font-bold leading-[16px] text-lagoon">Free</span>
          </div>
        </div>

        <div className="mt-[20px] border-t border-black/[0.07]" />

        {/* Actions */}
        <div className="mx-auto w-[246px] max-w-full pt-[20px]">
          <button
            type="button"
            onClick={onCheckout}
            disabled={checkoutDisabled}
            className={`h-[44px] w-full ${buttonRadius} bg-primary font-jakarta text-[14px] font-bold leading-[20px] text-white drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-[#d1d5db] disabled:drop-shadow-none`}
          >
            {checkoutLabel}
          </button>
          <Link
            to="/library"
            className={`mt-[10px] flex h-[42px] w-full items-center justify-center ${buttonRadius} border border-lagoon font-jakarta text-[14px] font-bold leading-[20px] text-lagoon transition-colors hover:bg-lagoon/5`}
          >
            Continue Browsing
          </Link>

          {/* WhatsApp note */}
          {variant === 'pill' ? (
            <div className="mt-[20px] flex h-[40px] items-center justify-center rounded-full bg-sand px-[12px]">
              <p className="text-center font-jakarta text-[8px] leading-[12px] text-clay">
                We'll send delivery updates to your registered WhatsApp number.
              </p>
            </div>
          ) : (
            <div className="mt-[20px] flex items-start gap-[10px] rounded-[14px] bg-sand p-[12px]">
              <CircleCheck className="mt-[2px] h-[14px] w-[14px] shrink-0 text-lagoon" strokeWidth={1.5} />
              <p className="font-jakarta text-[11px] leading-[17.875px] text-clay">
                We'll send delivery updates to your registered WhatsApp number.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
