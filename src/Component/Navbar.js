import React, { useState } from 'react'
import { Link, Links } from 'react-router-dom'
import { Menu, X, CheckCircle } from 'lucide-react';


function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const toggleFeaturesDropdown = () => {
    setFeaturesOpen(!featuresOpen);
  };


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
              {/* Features Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleFeaturesDropdown}
                  className="text-gray-600 hover:text-red-950 transition"
                >
                  Features
                </button>
                {featuresOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <Link
                        to="/typing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-950"
                      >
                        SpeedTyping
                      </Link>
                      <Link
                        to="/download"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-950"
                      >
                        Reel Downloader
                      </Link>
                      <Link
                        to="/features/feature3"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-950"
                      >
                        Feature 3
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Links */}
              {/* Uncomment Pricing if needed */}
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
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg z-10">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {/* Features Dropdown */}
            <div>
              <button
                onClick={toggleFeaturesDropdown}
                className="block text-gray-600 hover:text-red-950 py-2 w-full text-left"
              >
                Features
              </button>
              {featuresOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    to="/typing"
                    className="block text-gray-600 hover:text-red-950 py-1"
                  >
                    SpeedTyping
                  </Link>
                  <Link
                    to="/download"
                    className="block text-gray-600 hover:text-red-950 py-1"
                  >
                    Reel Downloader
                  </Link>
                  {/* <Link
                    to="/features/feature3"
                    className="block text-gray-600 hover:text-red-950 py-1"
                  >
                    Feature 3
                  </Link> */}
                </div>
              )}
            </div>
  
            {/* Other Links */}
            {/* Uncomment Pricing if needed */}
            {/* <Link to="/pricing" className="block text-gray-600 hover:text-red-950 py-2">Pricing</Link> */}
            <Link to="/about" className="block text-gray-600 hover:text-red-950 py-2">
              About
            </Link>
            <Link to="/contact" className="block text-gray-600 hover:text-red-950 py-2">
              Contact
            </Link>
            <Link to="/support" className="block text-gray-600 hover:text-red-950 py-2">
              Support
            </Link>
  
            {/* Speed Typing Test Link */}
            <Link
              to="/typing"
              className="w-full bg-red-950 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition block text-center"
            >
              Speed Typing Test
            </Link>
          </div>
        </div>
        )}
      </nav>
    </div>
  );
}

export default Navbar
