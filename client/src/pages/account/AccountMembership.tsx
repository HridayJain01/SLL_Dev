import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles, X } from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow, IMembership } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getMembershipWhatsAppLink } from '@/lib/whatsapp';
import {
  getMembershipAllowance,
  isMembershipActive,
  normalizePlanCode,
  PLAN_DEFINITIONS,
  PLAN_ORDER,
  PLAN_TABS,
  type PlanCode,
  type PlanDuration,
} from '@/lib/plans';
import { bookOf, formatDate } from '@/lib/orders';
import { AccountPage, AccountPageHeader, Card, CardTitle } from '@/components/account/AccountCard';

/**
 * Membership inside the dashboard. The public `/membership` page is the sales
 * pitch; this one leads with what the member already has — plan, expiry, and
 * how much of this month's quota is left — and only then offers the switch.
 */
export default function AccountMembership() {
  const user = useAuthStore((s) => s.user);
  const [duration, setDuration] = useState<PlanDuration>(1);

  const { data: membership, isLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
    enabled: !!user,
  });

  const { data: borrows } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
    enabled: !!user,
  });

  const active = isMembershipActive(membership);
  const allowance = getMembershipAllowance(active ? membership : null);
  const currentPlan = active ? normalizePlanCode(membership?.plan) : null;

  const now = new Date();
  const cycleBorrows = (borrows ?? []).filter(
    (borrow) =>
      borrow.cycleMonth === now.getMonth() + 1 &&
      borrow.cycleYear === now.getFullYear() &&
      (borrow.status === 'ACTIVE' || borrow.status === 'RETURNED')
  );
  const usedBooks = cycleBorrows.filter((borrow) => bookOf(borrow)?.kind !== 'puzzle').length;
  const usedPuzzles = cycleBorrows.filter((borrow) => bookOf(borrow)?.kind === 'puzzle').length;
  const quotaTotal =
    allowance.monthlyTotalLimit ||
    (allowance.monthlyBookLimit || 0) + (allowance.monthlyPuzzleLimit || 0);
  const quotaProgress = quotaTotal > 0 ? Math.min(100, (cycleBorrows.length / quotaTotal) * 100) : 0;

  return (
    <AccountPage>
      <AccountPageHeader
        title="Membership"
        subtitle="Your plan, what's left this month, and how to change it."
      />

      {/* Current plan */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <span className="flex items-center gap-[8px]">
              <Sparkles className="h-[16px] w-[16px] text-lagoon-deep" strokeWidth={1.6} />
              Current plan
            </span>
          </CardTitle>
          <StatusPill membership={membership} active={active} isLoading={isLoading} />
        </div>

        {isLoading ? (
          <p className="pt-[16px] font-body text-[14px] text-slate-muted">Loading your plan…</p>
        ) : active && membership ? (
          <div className="pt-[18px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-heading text-[22px] font-extrabold leading-[28px] text-night">
                {allowance.label}
              </p>
              <p className="font-body text-[14px] leading-[20px] text-slate-muted">
                Renews / ends {formatDate(membership.endDate)}
              </p>
            </div>

            <div className="mt-[16px] rounded-[16px] bg-[#f6f8f8] p-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-body text-[13px] font-semibold leading-[20px] text-night">
                  This month's quota
                </span>
                <span className="font-body text-[13px] font-bold leading-[20px] text-lagoon-deep">
                  {allowance.monthlyTotalLimit
                    ? `${cycleBorrows.length} / ${allowance.monthlyTotalLimit} items`
                    : `${usedBooks} / ${allowance.monthlyBookLimit} books${
                        allowance.monthlyPuzzleLimit
                          ? ` · ${usedPuzzles} / ${allowance.monthlyPuzzleLimit} puzzles`
                          : ''
                      }`}
                </span>
              </div>
              <div className="mt-[10px] h-[10px] overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className="h-[10px] rounded-full bg-lagoon transition-[width] duration-500 ease-out"
                  style={{ width: `${quotaProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="pt-[16px] font-body text-[14px] leading-[22px] text-slate-muted">
            {membership
              ? 'Your membership is not active right now, so ordering is paused. Pick a plan below to start it again.'
              : 'You do not have a membership yet. Pick a plan below and we will set it up on WhatsApp.'}
          </p>
        )}
      </Card>

      {/* Plan chooser */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{active ? 'Change your plan' : 'Choose a plan'}</CardTitle>
            <p className="pt-[4px] font-body text-[13px] leading-[20px] text-slate-muted">
              Payment and activation happen over WhatsApp — we'll confirm within 24 hours.
            </p>
          </div>

          <div className="inline-flex shrink-0 flex-wrap gap-[2px] rounded-full bg-[#f3f4f6] p-[4px]">
            {PLAN_TABS.map((tab) => (
              <button
                key={tab.duration}
                type="button"
                onClick={() => setDuration(tab.duration)}
                className={cn(
                  'rounded-full px-[14px] py-[7px] font-body text-[13px] font-semibold leading-[18px] transition-colors',
                  duration === tab.duration
                    ? 'bg-white text-night shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                    : 'text-slate-muted hover:text-night'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-[16px] pt-[22px] lg:grid-cols-3">
          {PLAN_ORDER.map((planCode) => (
            <PlanCard
              key={planCode}
              planCode={planCode}
              duration={duration}
              isCurrent={currentPlan === planCode}
            />
          ))}
        </div>
      </Card>
    </AccountPage>
  );
}

function StatusPill({
  membership,
  active,
  isLoading,
}: {
  membership?: IMembership | null;
  active: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return null;

  const { label, className } = active
    ? { label: 'Active', className: 'bg-chip-mint text-lagoon-darkest' }
    : membership
      ? { label: 'Inactive', className: 'bg-chip-butter text-[#92400e]' }
      : { label: 'No plan', className: 'bg-[#f3f4f6] text-slate-muted' };

  return (
    <span
      className={cn(
        'rounded-full px-[12px] py-[5px] font-body text-[12px] font-bold leading-[16px]',
        className
      )}
    >
      {label}
    </span>
  );
}

function PlanCard({
  planCode,
  duration,
  isCurrent,
}: {
  planCode: PlanCode;
  duration: PlanDuration;
  isCurrent: boolean;
}) {
  const plan = PLAN_DEFINITIONS[planCode];
  const { price, savings } = plan.pricing[duration];
  const unit = duration === 1 ? 'mo' : duration === 12 ? 'yr' : `${duration}mo`;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-[18px] border p-[20px] transition-colors',
        isCurrent
          ? 'border-lagoon-deep bg-[#f6fbfa]'
          : 'border-[#e5e7eb] bg-white hover:border-[#cbd5d3]'
      )}
    >
      {isCurrent ? (
        <span className="absolute right-[16px] top-[16px] rounded-full bg-lagoon-deep px-[10px] py-[3px] font-body text-[10px] font-bold uppercase leading-[15px] tracking-[0.6px] text-white">
          Current
        </span>
      ) : (
        plan.badge && (
          <span className="absolute right-[16px] top-[16px] rounded-full bg-chip-peach px-[10px] py-[3px] font-body text-[10px] font-bold uppercase leading-[15px] tracking-[0.6px] text-primary-dark">
            {plan.badge}
          </span>
        )
      )}

      <h3 className="font-heading text-[18px] font-extrabold leading-[24px] text-night">
        {plan.label}
      </h3>
      <p className="pt-[2px] font-body text-[13px] leading-[19px] text-slate-muted">
        {plan.subtitle}
      </p>

      <p className="pt-[14px]">
        <span className="font-heading text-[30px] font-extrabold leading-[34px] text-night">
          ₹{price}
        </span>
        <span className="font-body text-[14px] font-semibold text-slate-muted">/{unit}</span>
      </p>
      {savings > 0 && (
        <p className="pt-[2px] font-body text-[12px] font-semibold leading-[16px] text-lagoon-deep">
          Save ₹{savings}
        </p>
      )}

      <ul className="flex-1 space-y-[8px] pt-[16px]">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-[8px] font-body text-[13px] leading-[19px] text-[#374151]"
          >
            <Check className="mt-[3px] h-[13px] w-[13px] shrink-0 text-lagoon-deep" strokeWidth={2.4} />
            {feature}
          </li>
        ))}
        {plan.excludedFeatures?.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-[8px] font-body text-[13px] leading-[19px] text-[#9ca3af]"
          >
            <X className="mt-[3px] h-[13px] w-[13px] shrink-0" strokeWidth={2.4} />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href={getMembershipWhatsAppLink(planCode, duration, price)}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'mt-[18px] block rounded-full px-[18px] py-[11px] text-center font-body text-[14px] font-bold leading-[20px] transition-colors',
          isCurrent
            ? 'border border-lagoon-deep text-lagoon-deep hover:bg-lagoon-deep/5'
            : 'bg-lagoon-deep text-white hover:bg-lagoon-darkest'
        )}
      >
        {isCurrent ? 'Renew on WhatsApp' : 'Switch on WhatsApp'}
      </a>
    </article>
  );
}
