/** Shared by the public FAQ page and the dashboard's help screen. */
export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: 'How does borrowing work?',
    a: 'You can browse the library, request a book, and we will deliver it to your address. You can keep it for the duration of your borrowing period.',
  },
  {
    q: 'How is my membership activated?',
    a: 'Once you pay via WhatsApp, our admin will verify the payment and activate your membership within 24 hours.',
  },
  {
    q: 'What happens if I return books late?',
    a: 'Late returns may affect your quota for the next cycle. We kindly request returning books on time so other children can enjoy them.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Yes, you can move from Little Reader to Star Reader or Wonder Bundle anytime. Message us on WhatsApp and we will help with the upgrade.',
  },
  {
    q: 'Are puzzles included in all plans?',
    a: 'Puzzles are available on Star Reader, while Wonder Bundle includes a dedicated monthly puzzle allowance. Little Reader is books-only.',
  },
];
