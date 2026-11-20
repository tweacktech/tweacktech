import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';

const SupportPage = () => {
  const [ticketType, setTicketType] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { api, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const ticketTypes = [
    { value: 'technical', label: 'Technical Issue', icon: <HelpCircle className="w-5 h-5" /> },
    { value: 'billing', label: 'Billing & Payments', icon: <Mail className="w-5 h-5" /> },
    { value: 'account', label: 'Account Access', icon: <UserIcon className="w-5 h-5" /> },
    { value: 'general', label: 'General Inquiry', icon: <MessageCircle className="w-5 h-5" /> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/support' } });
      return;
    }
    setError('');
    try {
      await api.post('/support/tickets', {
        subject,
        description,
        category: ticketType,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.code === 'DATABASE_OFFLINE'
          ? 'Support is temporarily offline. Please try again in a moment.'
          : err.response?.data?.message || 'Failed to submit ticket. Please try again.',
      );
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <Navbar />
        <div className="max-w-md w-full text-center py-20">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ticket submitted!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Our support team will get back to you soon.</p>
          <Link to="/dashboard" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 slide-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Support Center</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Need help? We're here for you. Submit a support ticket and our team will assist you.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 slide-up" style={{ animationDelay: '0.1s' }}>
          {!isAuthenticated && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              Sign in to open a ticket and track replies. The chat assistant below can help
              instantly without signing in.
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What do you need help with?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticketTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTicketType(type.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                      ticketType === type.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-400'
                    }`}
                  >
                    {type.icon}
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Briefly describe your issue"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Please provide as much detail as possible..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {isAuthenticated ? 'Submit Ticket' : 'Sign in to submit'}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Inline user icon
function UserIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default SupportPage;
