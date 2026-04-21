import { CheckCircle2, MessageCircle, UserCheck, BookOpen } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      title: 'Choose a Plan',
      description: 'Select between our Normal or Premium membership plans based on your needs.',
      icon: CheckCircle2,
    },
    {
      title: 'Pay via WhatsApp',
      description: 'Send a quick message and complete your payment easily via UPI.',
      icon: MessageCircle,
    },
    {
      title: 'Admin Activation',
      description: 'Our team will verify your payment and activate your account instantly.',
      icon: UserCheck,
    },
    {
      title: 'Borrow & Enjoy',
      description: 'Browse the library, request books, and enjoy reading with your child!',
      icon: BookOpen,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Get started in 4 simple steps and unlock a world of knowledge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gray-100" />
                )}
                <div className="relative z-10 w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
