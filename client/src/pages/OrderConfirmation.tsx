import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow } from '@/types';
import Navbar from '@/components/layout/Navbar';
import WhatsAppGlyph from '@/components/icons/WhatsAppGlyph';
import { formatDeliveryWindow, groupBorrowsIntoOrders } from '@/lib/orders';
import { useAuthStore } from '@/store/authStore';

export type OrderConfirmationState = {
  orderRef?: string;
  deliveryWindow?: string;
  itemCount?: number;
};

/**
 * Order confirmation — Figma node 355:1085. No footer on this screen; the
 * mascot artwork carries the page.
 *
 * Checkout passes the placed order through router state; on a reload (where
 * that state is gone) the most recent order is read back from `/borrows`.
 */
export default function OrderConfirmation() {
  const { state } = useLocation() as { state: OrderConfirmationState | null };
  const user = useAuthStore((s) => s.user);
  const hasState = Boolean(state?.orderRef);

  const { data: latestOrder } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
    enabled: !!user && !hasState,
    select: (borrows) => groupBorrowsIntoOrders(borrows)[0] ?? null,
  });

  const orderRef = state?.orderRef ?? latestOrder?.ref ?? '—';
  const deliveryWindow =
    state?.deliveryWindow ??
    (latestOrder ? formatDeliveryWindow(latestOrder.placedAt) : 'Confirming your delivery window');
  const itemCount = state?.itemCount ?? latestOrder?.items.length ?? 0;

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
            <h1 className="font-heading text-[36px] font-extrabold leading-[1.1] tracking-[-0.88px] text-night sm:text-[72px] sm:leading-[55px]">
              Your box is on its way
            </h1>
            <p className="max-w-[540px] font-body text-[20px] leading-[26px] text-black">
              Your Star Learners box{itemCount > 0 ? ` of ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''} has
              been confirmed.
            </p>
          </div>

          {/* Order card */}
          <div className="mt-[34px] w-full max-w-[680px] overflow-hidden rounded-[24px] bg-white shadow-[0px_4px_32px_0px_rgba(26,26,46,0.07),0px_1px_4px_0px_rgba(26,26,46,0.04)]">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(26,26,46,0.07)] px-[20px] pb-[21px] pt-[20px] sm:gap-4 sm:px-[32px]">
              <p className="min-w-0 break-words font-heading text-[18px] font-bold leading-[24px] text-night sm:text-[20px]">
                Order {orderRef}
              </p>
              <span className="shrink-0 rounded-full bg-[#d6f5ee] px-[12px] py-[4px] font-body text-[14px] font-semibold leading-[16px] text-lagoon-darkest">
                Confirmed
              </span>
            </div>
            <div className="flex flex-col gap-1 px-[20px] pb-[21px] pt-[20px] sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-[32px]">
              <p className="font-body text-[14px] font-semibold leading-[20px] text-[#90a1b9] sm:min-w-[180px]">
                Estimated Delivery
              </p>
              <p className="font-body text-[14px] font-semibold leading-[19.25px] text-night sm:max-w-[340px] sm:text-right">
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
