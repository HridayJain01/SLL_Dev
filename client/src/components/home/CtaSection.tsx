import { Link } from 'react-router-dom';
import reading from '@/assets/figma/Kidreadingbook.jpg';

export default function CtaSection() {
  return (
    <section
      className="relative overflow-hidden bg-cover bg-center py-24"
      style={{
        // Replace with your own background image
        backgroundImage: reading,
      }}
    >
      {/* Optional Overlay */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative mx-auto flex max-w-[1280px] justify-center px-6">
        <div className="w-full max-w-[900px] rounded-[34px] bg-[#FFC928] px-12 py-14 shadow-xl lg:px-16 lg:py-16">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            {/* Left Content */}
            <div className="max-w-[520px]">
              <h2 className="font-heading text-[50px] font-black leading-tight text-[#1F1F1F] lg:text-[58px]">
                Let's Get{' '}
                <span className="italic">
                  Started!
                </span>
              </h2>

              <p className="mt-8 text-[22px] font-semibold leading-9 text-[#4F5A67]">
                Start your child's reading journey
              </p>

              <p className="mt-2 text-[22px] font-semibold leading-9 text-[#4F5A67]">
                Curated books, flexible plans,
                <br />
                and fresh picks every month.
              </p>

              <Link
                to="/membership"
                className="mt-12 inline-flex rounded-full bg-[#F86A2B] px-12 py-4 font-heading text-[18px] font-bold text-white transition duration-300 hover:scale-105 hover:bg-[#EC5F1D]"
              >
                Join Now
              </Link>
            </div>

            {/* Right Decoration */}
            <div className="hidden lg:flex items-end justify-end">
              <div className="relative h-[130px] w-[130px]">
                <span className="absolute right-0 top-0 text-[105px] text-[#242424]">
                  ✦
                </span>

                <span className="absolute bottom-3 left-3 text-[58px] text-white drop-shadow-md">
                  ✦
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}