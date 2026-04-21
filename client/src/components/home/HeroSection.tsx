import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-gray-900 mb-6">
          Books That Grow With <span className="text-primary">Your Child</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto">
          Discover a magical world of storybooks, educational reads, and fun puzzles. Curated for curious minds from toddlers to pre-teens.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/library"
            className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-transform hover:scale-105 flex items-center"
          >
            Browse Library
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to get a membership for Star Learners Library.")}`}
            className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 hover:border-primary hover:text-primary rounded-full font-bold text-lg transition-colors shadow-sm flex items-center"
          >
            Get Membership
          </a>
        </div>
      </div>
    </section>
  );
}
