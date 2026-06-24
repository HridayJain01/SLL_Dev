export const PLAN_ORDER = ['LITTLE_READER', 'STAR_READER', 'WONDER_BUNDLE'] as const;
export type PlanCode = (typeof PLAN_ORDER)[number];
export type PlanDuration = 1 | 3 | 6 | 12;

type PlanDefinition = {
  code: PlanCode;
  label: string;
  subtitle: string;
  badge?: string;
  monthlyPrice: number;
  features: string[];
  excludedFeatures?: string[];
  pricing: Record<PlanDuration, { price: number; savings: number }>;
  monthlyBookLimit: number | null;
  monthlyPuzzleLimit: number | null;
  monthlyTotalLimit: number | null;
};

export const PLAN_TABS: Array<{ label: string; duration: PlanDuration }> = [
  { label: 'Monthly', duration: 1 },
  { label: '3 Months', duration: 3 },
  { label: '6 Months', duration: 6 },
  { label: 'Yearly', duration: 12 },
];

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  LITTLE_READER: {
    code: 'LITTLE_READER',
    label: 'Little Reader',
    subtitle: 'A gentle start to the reading habit',
    monthlyPrice: 450,
    features: [
      '5 books per month',
      'Pick from 400+ titles',
      'Age-based catalogue access',
      'Free doorstep delivery',
      'Monthly swap',
      'WhatsApp support',
    ],
    excludedFeatures: ['Puzzles'],
    pricing: {
      1: { price: 450, savings: 0 },
      3: { price: 1200, savings: 150 },
      6: { price: 2200, savings: 500 },
      12: { price: 4200, savings: 1200 },
    },
    monthlyBookLimit: 5,
    monthlyPuzzleLimit: 0,
    monthlyTotalLimit: null,
  },
  STAR_READER: {
    code: 'STAR_READER',
    label: 'Star Reader',
    subtitle: 'The sweet spot for curious kids',
    badge: 'Most Popular',
    monthlyPrice: 720,
    features: [
      '8 books or puzzles',
      'Pick from 400+ titles',
      'Age-based catalogue access',
      'Free doorstep delivery',
      'Monthly swap',
      'WhatsApp support',
    ],
    pricing: {
      1: { price: 720, savings: 0 },
      3: { price: 2000, savings: 160 },
      6: { price: 3800, savings: 520 },
      12: { price: 7200, savings: 1440 },
    },
    monthlyBookLimit: null,
    monthlyPuzzleLimit: null,
    monthlyTotalLimit: 8,
  },
  WONDER_BUNDLE: {
    code: 'WONDER_BUNDLE',
    label: 'Wonder Bundle',
    subtitle: 'For the child who wants it all',
    monthlyPrice: 950,
    features: [
      '6 books per month',
      '4 puzzles per month',
      'Pick from 400+ titles',
      'Age-based catalogue access',
      'Free doorstep delivery',
      'Monthly swap',
      'WhatsApp support',
    ],
    pricing: {
      1: { price: 950, savings: 0 },
      3: { price: 2700, savings: 150 },
      6: { price: 5200, savings: 500 },
      12: { price: 9900, savings: 1500 },
    },
    monthlyBookLimit: 6,
    monthlyPuzzleLimit: 4,
    monthlyTotalLimit: null,
  },
};

export function normalizePlanCode(plan?: string | null): PlanCode | null {
  if (!plan) return null;
  if (plan === 'NORMAL') return 'LITTLE_READER';
  if (plan === 'PREMIUM') return 'STAR_READER';
  return PLAN_ORDER.includes(plan as PlanCode) ? (plan as PlanCode) : null;
}

export function getPlanLabel(plan?: string | null) {
  const normalized = normalizePlanCode(plan);
  return normalized ? PLAN_DEFINITIONS[normalized].label : 'Unknown Plan';
}

export function normalizePlanAccess(planAccess?: string[] | null, kind: 'book' | 'puzzle' = 'book'): PlanCode[] {
  const expanded = new Set<PlanCode>();

  for (const entry of planAccess ?? []) {
    const normalized = normalizePlanCode(entry);
    if (entry === 'NORMAL' || normalized === 'LITTLE_READER') {
      expanded.add('LITTLE_READER');
      expanded.add('STAR_READER');
      expanded.add('WONDER_BUNDLE');
      continue;
    }
    if (entry === 'PREMIUM' || normalized === 'STAR_READER') {
      expanded.add('STAR_READER');
      expanded.add('WONDER_BUNDLE');
      continue;
    }
    if (normalized === 'WONDER_BUNDLE') {
      expanded.add('WONDER_BUNDLE');
    }
  }

  if (expanded.size === 0) {
    return kind === 'puzzle' ? ['STAR_READER', 'WONDER_BUNDLE'] : [...PLAN_ORDER];
  }

  return PLAN_ORDER.filter((plan) => expanded.has(plan));
}

export function getMembershipAllowance(
  membership?:
    | {
        plan?: string | null;
        booksPerCycle?: number;
        monthlyBookLimit?: number | null;
        monthlyPuzzleLimit?: number | null;
        monthlyTotalLimit?: number | null;
      }
    | null
) {
  if (!membership) {
    return {
      planCode: null,
      label: '',
      monthlyBookLimit: 0,
      monthlyPuzzleLimit: 0,
      monthlyTotalLimit: 0,
    };
  }

  const planCode = normalizePlanCode(membership.plan);
  const fallback = planCode ? PLAN_DEFINITIONS[planCode] : null;

  return {
    planCode,
    label: fallback?.label ?? 'Membership',
    monthlyBookLimit:
      membership.monthlyBookLimit ?? fallback?.monthlyBookLimit ?? membership.booksPerCycle ?? 0,
    monthlyPuzzleLimit: membership.monthlyPuzzleLimit ?? fallback?.monthlyPuzzleLimit ?? 0,
    monthlyTotalLimit: membership.monthlyTotalLimit ?? fallback?.monthlyTotalLimit ?? 0,
  };
}
