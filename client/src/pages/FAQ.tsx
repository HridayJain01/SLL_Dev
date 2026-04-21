import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    { q: "How does borrowing work?", a: "You can browse the library, request a book, and we will deliver it to your address. You can keep it for the duration of your borrowing period." },
    { q: "How is my membership activated?", a: "Once you pay via WhatsApp, our admin will verify the payment and activate your membership within 24 hours." },
    { q: "What happens if I return books late?", a: "Late returns may affect your quota for the next cycle. We kindly request returning books on time so other children can enjoy them." },
    { q: "Can I upgrade from Normal to Premium?", a: "Yes, you can upgrade anytime. Just contact us on WhatsApp and we will adjust the pricing accordingly." },
    { q: "Are puzzles included in all plans?", a: "Puzzles are exclusive to the Premium plan." },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-heading font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border rounded-lg overflow-hidden">
            <button 
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex justify-between items-center p-5 text-left font-medium text-gray-900 hover:bg-gray-50"
            >
              {faq.q}
              {open === i ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
            </button>
            {open === i && (
              <div className="p-5 border-t bg-gray-50 text-gray-700">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
