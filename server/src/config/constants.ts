export const PLAN_QUOTA = { NORMAL: 5, PREMIUM: 8 } as const;

export const PLAN_PRICING = {
  NORMAL:  { 1: 450,  3: 1200, 6: 2200,  12: 4200 },
  PREMIUM: { 1: 720,  3: 2000, 6: 3800,  12: 7200 },
} as const;

export const PLAN_SAVINGS = {
  NORMAL:  { 1: 0, 3: 150, 6: 500, 12: 1200 },
  PREMIUM: { 1: 0, 3: 160, 6: 520, 12: 0 },
} as const;

export const BORROW_DURATION_DAYS = 15;
export const REMINDER_DAYS_BEFORE = 3;
export const WHATSAPP_NUMBER = '919XXXXXXXXX'; // replace with real number
