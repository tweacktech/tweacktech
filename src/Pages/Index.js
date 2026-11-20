import React, { useState } from 'react';
import { Menu, X, CheckCircle, BookOpen, Code, Users } from 'lucide-react';
import '../App.css';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';
import Header from '../Component/Header';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: CheckCircle,
      title: 'Seamless Integration',
      description: 'Effortlessly connect with your existing tools and workflows.'
    },
    {
      icon: CheckCircle,
      title: 'Real-time Analytics',
      description: 'Gain instant insights with our powerful data visualization.'
    },
    {
      icon: CheckCircle,
      title: 'Scalable Architecture',
      description: 'Built to grow with your business, from startup to enterprise.'
    }
  ];

  return (
    <div className="bg-red-800 min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Header Section */}
      <Header />

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Platform
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2"
              >
                <div className="flex items-center mb-4">
                  <feature.icon className="text-red-950 mr-4" size={40} />
                  <h3 className="text-xl font-semibold text-gray-800">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              <Code className="mx-auto mb-6 text-red-950" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Build</h3>
              <p className="text-gray-600">
                Powerful development tools and collaborative environments.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
              <Users className="mx-auto mb-6 text-blue-600" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Connect</h3>
              <p className="text-gray-600">
                Network with global experts and like-minded innovators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;