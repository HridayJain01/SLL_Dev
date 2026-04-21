import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 text-primary mb-4">
              <BookOpen className="h-6 w-6" />
              <span className="font-heading font-bold text-xl">Star Learners Library</span>
            </Link>
            <p className="text-gray-500 max-w-sm mb-4">
              Providing children with a world of imagination and learning through our curated collection of books, activities, and puzzles.
            </p>
            <div className="flex flex-col space-y-2 text-gray-600">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="flex items-center space-x-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                <span>+91 9XXXXXXXXX</span>
              </a>
              <a href="mailto:hello@starlearners.com" className="flex items-center space-x-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                <span>hello@starlearners.com</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/library" className="text-gray-500 hover:text-primary transition-colors">Library</Link></li>
              <li><Link to="/membership" className="text-gray-500 hover:text-primary transition-colors">Membership</Link></li>
              <li><Link to="/about" className="text-gray-500 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="text-gray-500 hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-500 hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="text-gray-500 hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Star Learners Library. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed with ❤️ for kids</p>
        </div>
      </div>
    </footer>
  );
}
