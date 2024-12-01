import React, { useState } from 'react';
import { Send, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form Submitted:', formData);
    alert('Message sent successfully!');
    // Reset form after submission
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 py-0 pt-24 pb-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <MapPin className="text-red-950" size={28} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Address</h3>
                    <p className="text-gray-600">Jabi, Abuja</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Phone className="text-green-600" size={28} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Phone</h3>
                    <p className="text-gray-600">(+234) 7065216112</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Mail className="text-red-600" size={28} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Email</h3>
                    <p className="text-gray-600">meyorpop@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mt-10 border-t pt-8 flex justify-center space-x-6">
                <Link to="https://github.com/tweacktech/"
                target="_blank"
                  className="text-gray-600 hover:text-red-950 transition"
                  aria-label="GitHub"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </Link>
                <Link to="https://www.linkedin.com/in/dari-datongs/"
                target="_blank"
                  className="text-gray-600 hover:text-red-950 transition"
                  aria-label="LinkedIn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </Link>
                <Link to="#"
                  className="text-gray-600 hover:text-red-950 transition"
                  aria-label="Twitter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                <MessageCircle className="mr-2 text-red-950" size={32} />
                Send a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-950"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-950"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-950"
                    placeholder="Purpose of your message"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-950"
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-950 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <Send className="mr-2" size={20} /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      
    
      </div>
      <Footer />
    </>

  );
};

export default ContactPage;