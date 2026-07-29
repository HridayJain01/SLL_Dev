import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQS } from '@/lib/faqs';

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-heading font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h1>
      
      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <div key={faq.q} className="bg-white border rounded-lg overflow-hidden">
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
