import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { PLAN_ORDER, PLAN_TABS, usePlans, type PlanCode, type PlanDefinition } from '@/lib/plans';

export default function AdminPlans() {
  const plans = usePlans();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Plans</h1>
      <p className="mb-6 text-sm text-gray-500">
        Prices, features and monthly limits shown on the website. Saving a plan also applies its
        limits to every member already on it.
      </p>
      <div className="grid gap-6 xl:grid-cols-3">
        {PLAN_ORDER.map((code) => (
          // Remount when the saved plan changes so the form shows what's stored.
          <PlanEditor key={`${code}:${JSON.stringify(plans[code])}`} code={code} plan={plans[code]} />
        ))}
      </div>
    </div>
  );
}

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);

function PlanEditor({ code, plan }: { code: PlanCode; plan: PlanDefinition }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    subtitle: plan.subtitle,
    badge: plan.badge ?? '',
    features: plan.features.join('\n'),
    excludedFeatures: (plan.excludedFeatures ?? []).join('\n'),
    pricing: Object.fromEntries(
      PLAN_TABS.map(({ duration }) => [
        duration,
        { price: String(plan.pricing[duration].price), savings: String(plan.pricing[duration].savings) },
      ])
    ) as Record<string, { price: string; savings: string }>,
    monthlyTotalLimit: plan.monthlyTotalLimit?.toString() ?? '',
    monthlyBookLimit: plan.monthlyBookLimit?.toString() ?? '',
    monthlyPuzzleLimit: plan.monthlyPuzzleLimit?.toString() ?? '',
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/plans/${code}`, {
        subtitle: form.subtitle,
        badge: form.badge,
        features: lines(form.features),
        excludedFeatures: lines(form.excludedFeatures),
        pricing: Object.fromEntries(
          Object.entries(form.pricing).map(([d, p]) => [d, { price: Number(p.price), savings: Number(p.savings) || 0 }])
        ),
        monthlyTotalLimit: numOrNull(form.monthlyTotalLimit),
        monthlyBookLimit: numOrNull(form.monthlyBookLimit),
        monthlyPuzzleLimit: numOrNull(form.monthlyPuzzleLimit),
      });
      return res.data as { membersUpdated: number };
    },
    onSuccess: ({ membersUpdated }) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(`${plan.label} saved${membersUpdated ? ` · ${membersUpdated} member(s) updated` : ''}`);
    },
    onError: (err) => {
      toast.error(isAxiosError(err) ? err.response?.data?.message ?? 'Could not save' : 'Could not save');
    },
  });

  const input = 'w-full rounded border p-2 text-sm';
  const label = 'mb-1 block text-xs font-medium uppercase text-gray-500';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-gray-900">{plan.label}</h2>

      <div>
        <label className={label}>Tagline</label>
        <input className={input} value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
      </div>
      <div>
        <label className={label}>Badge (optional)</label>
        <input
          className={input}
          placeholder="e.g. Most Popular"
          value={form.badge}
          onChange={(e) => set({ badge: e.target.value })}
        />
      </div>

      <div>
        <p className={label}>Price (₹) and savings</p>
        <div className="space-y-2">
          {PLAN_TABS.map(({ duration, label: tab }) => (
            <div key={duration} className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
              <span className="text-sm text-gray-600">{tab}</span>
              <input
                type="number"
                min={0}
                required
                aria-label={`${tab} price`}
                className={input}
                value={form.pricing[duration].price}
                onChange={(e) => set({ pricing: { ...form.pricing, [duration]: { ...form.pricing[duration], price: e.target.value } } })}
              />
              <input
                type="number"
                min={0}
                aria-label={`${tab} savings`}
                placeholder="Save"
                className={input}
                value={form.pricing[duration].savings}
                onChange={(e) => set({ pricing: { ...form.pricing, [duration]: { ...form.pricing[duration], savings: e.target.value } } })}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className={label}>Monthly limits</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['monthlyTotalLimit', 'Total items'],
            ['monthlyBookLimit', 'Books'],
            ['monthlyPuzzleLimit', 'Puzzles'],
          ] as const).map(([key, text]) => (
            <label key={key} className="text-xs text-gray-600">
              {text}
              <input
                type="number"
                min={0}
                max={100}
                placeholder="No cap"
                className={`${input} mt-1`}
                value={form[key]}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Set a total (books and puzzles share it), or leave it blank and set both books and
          puzzles. Puzzles 0 = no puzzles on this plan.
        </p>
      </div>

      <div>
        <label className={label}>Included (one per line)</label>
        <textarea rows={6} className={input} value={form.features} onChange={(e) => set({ features: e.target.value })} />
      </div>
      <div>
        <label className={label}>Not included (one per line)</label>
        <textarea
          rows={2}
          className={input}
          value={form.excludedFeatures}
          onChange={(e) => set({ excludedFeatures: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={save.isPending}
        className="w-full rounded bg-primary px-4 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {save.isPending ? 'Saving…' : `Save ${plan.label}`}
      </button>
    </form>
  );
}
