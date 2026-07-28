import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import WhatsAppGlyph from '@/components/icons/WhatsAppGlyph';

export type OrderConfirmationState = {
  orderRef?: string;
  deliveryWindow?: string;
};

/**
 * Order confirmation — Figma node 355:1085. No footer on this screen; the
 * mascot artwork carries the page.
 *
 * The order reference and delivery window arrive via router state from the
 * checkout action. TODO: there is no orders API yet, so both fall back to the
 * placeholder values from the design — swap these for the real order once
 * checkout is wired up.
 */
const DESIGN_PLACEHOLDER = {
  orderRef: '#SL-2024-08471',
  deliveryWindow: 'July 25 to July 29, 2026',
};

export default function OrderConfirmation() {
  const { state } = useLocation() as { state: OrderConfirmationState | null };
  const orderRef = state?.orderRef ?? DESIGN_PLACEHOLDER.orderRef;
  const deliveryWindow = state?.deliveryWindow ?? DESIGN_PLACEHOLDER.deliveryWindow;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1 px-4 pb-[60px] pt-[10px]">
        <div className="mx-auto flex max-w-[725px] flex-col items-center">
          <img
            src="/order-confirmation.png"
            alt=""
            className="h-[415px] w-[498px] max-w-full object-contain"
          />

          <div className="flex flex-col items-center gap-[12px] text-center">
            <h1 className="font-heading text-[48px] font-extrabold leading-[1.1] tracking-[-0.88px] text-night sm:text-[72px] sm:leading-[55px]">
              Your box is on its way
            </h1>
            <p className="max-w-[540px] font-body text-[20px] leading-[26px] text-black">
              Your Star Learners box has been confirmed.
            </p>
          </div>

          {/* Order card */}
          <div className="mt-[34px] w-full max-w-[680px] overflow-hidden rounded-[24px] bg-white shadow-[0px_4px_32px_0px_rgba(26,26,46,0.07),0px_1px_4px_0px_rgba(26,26,46,0.04)]">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(26,26,46,0.07)] px-[32px] pb-[21px] pt-[20px]">
              <p className="font-heading text-[20px] font-bold leading-[24px] text-night">
                Order {orderRef}
              </p>
              <span className="shrink-0 rounded-full bg-[#d6f5ee] px-[12px] py-[4px] font-body text-[14px] font-semibold leading-[16px] text-lagoon-darkest">
                Confirmed
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 px-[32px] pb-[21px] pt-[20px]">
              <p className="min-w-[180px] font-body text-[14px] font-semibold leading-[20px] text-[#90a1b9]">
                Estimated Delivery
              </p>
              <p className="max-w-[340px] text-right font-body text-[14px] font-semibold leading-[19.25px] text-night">
                {deliveryWindow}
              </p>
            </div>
          </div>

          {/* WhatsApp confirmation */}
          {/* Designed at 457px wide with the label on one line; `w-fit` keeps
              that single line when Inter's real metrics run a hair wider. */}
          <div className="mt-[27px] flex w-fit max-w-full items-center justify-center gap-[12px] rounded-full bg-[#f0faf8] px-[24px] py-[12px]">
            <WhatsAppGlyph className="h-[18px] w-[18px] shrink-0 text-lagoon-darkest" />
            <p className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-darkest sm:whitespace-nowrap">
              We've sent your order details to your WhatsApp number
            </p>
          </div>

          {/* Actions */}
          <Link
            to="/library"
            className="mt-[28px] flex w-[344px] max-w-full items-center justify-center rounded-[100px] bg-primary px-[28px] py-[14px] font-heading text-[14px] font-bold leading-[20px] tracking-[0.14px] text-white transition-colors hover:bg-primary-dark"
          >
            Go to Library
          </Link>

          <Link
            to="/account/orders"
            className="mt-[25px] flex items-center gap-[2px] font-body text-[14px] leading-[20px] text-black hover:text-primary"
          >
            View Order Details
            <ChevronRight className="h-[14px] w-[14px]" strokeWidth={1.6} />
          </Link>
        </div>
      </main>
    </div>
  );
}
