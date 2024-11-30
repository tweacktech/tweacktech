import React from 'react';
import { BookOpen, Code, Users } from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white ">
      {/* Navigation */}
     <Navbar/>

      {/* Hero Section */}
      <header className="relative pt-16 pb-32 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Innovate Faster. <br />
              <span className="text-blue-600">Build Smarter.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Empower your team with cutting-edge tools that transform ideas into reality. 
              Streamline your workflow and unlock unprecedented productivity.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg">
                Start Free Trial
              </button>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-full text-lg font-semibold border border-blue-600 hover:bg-blue-50 transition shadow-md">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Unlock Your Potential
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover features designed to elevate your productivity and innovation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
              <BookOpen className="mx-auto mb-6 text-blue-600" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Learn</h3>
              <p className="text-gray-600">
                Access comprehensive resources and guided learning paths.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
              <Code className="mx-auto mb-6 text-green-600" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Build</h3>
              <p className="text-gray-600">
                Powerful development tools and collaborative environments.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
              <Users className="mx-auto mb-6 text-purple-600" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Connect</h3>
              <p className="text-gray-600">
                Network with global experts and like-minded innovators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
     <Footer/>
    </div>
  );
};

export default LandingPage;