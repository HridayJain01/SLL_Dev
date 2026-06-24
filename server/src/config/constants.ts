export const PLAN_CODES = ['LITTLE_READER', 'STAR_READER', 'WONDER_BUNDLE'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];
export type PlanDuration = 1 | 3 | 6 | 12;

export type PlanAllowance = {
  monthlyBookLimit: number | null;
  monthlyPuzzleLimit: number | null;
  monthlyTotalLimit: number | null;
  booksPerCycle: number;
};

export const PLAN_DEFINITIONS: Record<
  PlanCode,
  {
    label: string;
    allowance: PlanAllowance;
    pricing: Record<PlanDuration, number>;
    savings: Record<PlanDuration, number>;
  }
> = {
  LITTLE_READER: {
    label: 'Little Reader',
    allowance: {
      monthlyBookLimit: 5,
      monthlyPuzzleLimit: 0,
      monthlyTotalLimit: null,
      booksPerCycle: 5,
    },
    pricing: { 1: 450, 3: 1200, 6: 2200, 12: 4200 },
    savings: { 1: 0, 3: 150, 6: 500, 12: 1200 },
  },
  STAR_READER: {
    label: 'Star Reader',
    allowance: {
      monthlyBookLimit: null,
      monthlyPuzzleLimit: null,
      monthlyTotalLimit: 8,
      booksPerCycle: 8,
    },
    pricing: { 1: 720, 3: 2000, 6: 3800, 12: 7200 },
    savings: { 1: 0, 3: 160, 6: 520, 12: 1440 },
  },
  WONDER_BUNDLE: {
    label: 'Wonder Bundle',
    allowance: {
      monthlyBookLimit: 6,
      monthlyPuzzleLimit: 4,
      monthlyTotalLimit: null,
      booksPerCycle: 10,
    },
    pricing: { 1: 950, 3: 2700, 6: 5200, 12: 9900 },
    savings: { 1: 0, 3: 150, 6: 500, 12: 1500 },
  },
} as const;

export const PLAN_QUOTA = Object.fromEntries(
  PLAN_CODES.map((plan) => [plan, PLAN_DEFINITIONS[plan].allowance.booksPerCycle])
) as Record<PlanCode, number>;

export const PLAN_PRICING = Object.fromEntries(
  PLAN_CODES.map((plan) => [plan, PLAN_DEFINITIONS[plan].pricing])
) as Record<PlanCode, Record<PlanDuration, number>>;

export const PLAN_SAVINGS = Object.fromEntries(
  PLAN_CODES.map((plan) => [plan, PLAN_DEFINITIONS[plan].savings])
) as Record<PlanCode, Record<PlanDuration, number>>;

export function normalizePlanCode(plan?: string | null): PlanCode | null {
  if (!plan) return null;
  if (plan === 'NORMAL') return 'LITTLE_READER';
  if (plan === 'PREMIUM') return 'STAR_READER';
  return PLAN_CODES.includes(plan as PlanCode) ? (plan as PlanCode) : null;
}

export function getPlanAllowance(plan?: string | null): PlanAllowance {
  const normalized = normalizePlanCode(plan) ?? 'LITTLE_READER';
  return PLAN_DEFINITIONS[normalized].allowance;
}

export function getPlanLabel(plan?: string | null) {
  const normalized = normalizePlanCode(plan);
  return normalized ? PLAN_DEFINITIONS[normalized].label : 'Unknown Plan';
}

export function normalizePlanAccess(
  planAccess?: string[] | null,
  kind: 'book' | 'puzzle' = 'book'
): PlanCode[] {
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
    return kind === 'puzzle' ? ['STAR_READER', 'WONDER_BUNDLE'] : [...PLAN_CODES];
  }

  return PLAN_CODES.filter((plan) => expanded.has(plan));
}

export function isPlanAllowedForBook(
  plan: string | null | undefined,
  planAccess?: string[] | null,
  kind: 'book' | 'puzzle' = 'book'
) {
  const normalizedPlan = normalizePlanCode(plan);
  if (!normalizedPlan) return false;
  return normalizePlanAccess(planAccess, kind).includes(normalizedPlan);
}

export const BORROW_DURATION_DAYS = 30;
export const REMINDER_DAYS_BEFORE = 3;
export const WHATSAPP_NUMBER = '919XXXXXXXXX'; // replace with real number
