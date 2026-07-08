import { Link } from 'react-router-dom';

const PLANS = [
  {
    name: 'Little Explorers',
    price: '450',
    tagline: 'PERFECT FOR TRYING THINGS OUT.',
    features: [
      '5 books per month',
      'Age-based curation',
      'Free delivery',
      'Easy monthly swaps',
    ],
    popular: false,
    bg: '#E8F5F0',
  },
  {
    name: 'Curious Creators',
    price: '720',
    tagline: 'OUR MOST POPULAR MEMBERSHIP.',
    features: [
      '8 books or puzzles',
      'Flexible selection',
      'Free delivery',
      'Priority curation',
    ],
    popular: true,
    bg: '#FFFCDD',
  },
  {
    name: 'Super Thinkers',
    price: '000',
    tagline: 'FOR FULL SUPPORT & 1:1 COACHING',
    features: [
      'Everything in Growth',
      'Monthly 1:1 coaching',
      'Personalized session recaps',
      'VIP Q&A calls',
    ],
    popular: false,
    bg: '#ECEBFF',
  },
];

export default function PricingPlans() {
  return (
    <section
      className="py-20 lg:py-28"
      style={{ backgroundColor: '#F9F6EF' }}
    >
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-heading text-[54px] font-black text-[#25302B]">
            Plans That Fit You
          </h2>

          {/* Toggle (UI Only) */}
          <div className="mt-6 inline-flex rounded-full bg-white p-1 shadow-md">
            <button className="rounded-full bg-[#F9732A] px-5 py-2 text-[12px] font-bold text-white">
              Monthly
            </button>

            <button className="px-5 py-2 text-[12px] text-[#666]">
              3 Months
            </button>

            <button className="px-5 py-2 text-[12px] text-[#666]">
              6 Months
            </button>

            <button className="px-5 py-2 text-[12px] text-[#666]">
              Yearly
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-14 grid max-w-[1120px] grid-cols-1 gap-7 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative flex h-[430px] flex-col rounded-[28px] px-8 py-7 text-center"
              style={{ backgroundColor: plan.bg }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1698E5] px-3 py-[4px] text-[9px] font-bold uppercase tracking-widest text-white">
                  ★ MOST POPULAR
                </div>
              )}

              <h3 className="font-heading text-[24px] font-black leading-tight text-[#25302B]">
                {plan.name}
              </h3>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#333]">
                {plan.tagline}
              </p>

              <div className="mt-5">
                <span className="text-[42px] font-black text-[#333]">
                  {plan.price}
                </span>

                <span className="text-[16px] font-bold text-[#333]">
                  /mo
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-2 text-[16px] leading-7 text-[#4F5958]">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <Link
                to="/membership"
                className="mt-auto inline-block self-center rounded-full bg-[#F9732A] px-8 py-3 text-[14px] font-bold text-white transition duration-300 hover:scale-105"
              >
                Join Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}