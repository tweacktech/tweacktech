import React, { useState } from 'react'
import { Link, Links } from 'react-router-dom'
import { Menu, X, CheckCircle } from 'lucide-react';


function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <div>
      <nav className="fixed w-full z-50 bg-white/90 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-red-950 flex items-center space-x-2 pl-2">
                <img src={require('./tweacktech.jpg')} alt="logo" className="w-10 h-10 rounded-full" />
                <span>TweackTech</span>
              </Link>
            </div>


            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-red-950 transition">Features</Link>
              {/* <Link to="/pricing" className="text-gray-600 hover:text-red-950 transition">Pricing</Link> */}
              <Link to="/about" className="text-gray-600 hover:text-red-950 transition">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-red-950 transition">Contact</Link>
              <Link to="/support" className="text-gray-600 hover:text-red-950 transition">Support</Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-red-950 "
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu className='pr-1' size={28} />}
              </button>
            </div>

            <div className="hidden md:block">

              <Link to="/typing" className="bg-red-950 text-white px-4 py-2 pt-2 rounded-lg hover:bg-blue-700 transition">Speed TypingTest</Link>

            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link to="/features" className="block text-gray-600 hover:text-red-950 py-2">Features</Link>
              {/* <Link to="/pricing" className="block text-gray-600 hover:text-red-950 py-2">Pricing</Link> */}
              <Link to="/about" className="block text-gray-600 hover:text-red-950 py-2">About</Link>
              <Link to="/contact" className="block text-gray-600 hover:text-red-950 py-2">Contact</Link>
              <Link to="/support" className="block text-gray-600 hover:text-red-950 py-2">Support</Link>

              <Link to="/typing" className="w-full bg-red-950 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Speed TypingTest</Link>

            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export default Navbar
