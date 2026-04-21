import { Check } from 'lucide-react';
import { getMembershipWhatsAppLink } from '@/lib/whatsapp';

export default function Membership() {
  const normalPricing = [
    { duration: 1, price: 450, savings: 0 },
    { duration: 3, price: 1200, savings: 150 },
    { duration: 6, price: 2200, savings: 500 },
    { duration: 12, price: 4200, savings: 1200 },
  ];

  const premiumPricing = [
    { duration: 1, price: 720, savings: 0 },
    { duration: 3, price: 2000, savings: 160 },
    { duration: 6, price: 3800, savings: 520 },
    { duration: 12, price: 7200, savings: 0 },
  ];

  return (
    <div className="bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">Choose Your Membership</h1>
          <p className="text-xl text-gray-600">Give your child the gift of reading. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Normal Plan */}
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Normal Plan</h2>
            <p className="text-gray-500 mb-6">Perfect for regular readers.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900">₹450</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> 5 Books per month</li>
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> Standard library access</li>
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> Free home delivery</li>
            </ul>

            <div className="space-y-3">
              {normalPricing.map((p) => (
                <a
                  key={p.duration}
                  href={getMembershipWhatsAppLink('NORMAL', p.duration, p.price)}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full border border-gray-200 hover:border-primary rounded-lg p-3 text-center transition-colors relative"
                >
                  <div className="font-medium">{p.duration} Month{p.duration > 1 ? 's' : ''} - ₹{p.price}</div>
                  {p.savings > 0 && <div className="text-xs text-green-600 font-bold absolute top-1 right-2">Save ₹{p.savings}</div>}
                </a>
              ))}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-primary/5 rounded-2xl shadow-md border border-primary p-8 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Premium Plan</h2>
            <p className="text-gray-500 mb-6">Best for avid readers & puzzle lovers.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900">₹720</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> 8 Books + Puzzles per month</li>
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> Premium library access</li>
              <li className="flex items-center text-gray-700"><Check className="h-5 w-5 text-green-500 mr-3" /> Priority delivery</li>
            </ul>

            <div className="space-y-3">
              {premiumPricing.map((p) => (
                <a
                  key={p.duration}
                  href={getMembershipWhatsAppLink('PREMIUM', p.duration, p.price)}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full border-2 border-primary/20 hover:border-primary bg-white rounded-lg p-3 text-center transition-colors relative"
                >
                  <div className="font-medium text-primary-dark">{p.duration} Month{p.duration > 1 ? 's' : ''} - ₹{p.price}</div>
                  {p.savings > 0 && <div className="text-xs text-green-600 font-bold absolute top-1 right-2">Save ₹{p.savings}</div>}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
