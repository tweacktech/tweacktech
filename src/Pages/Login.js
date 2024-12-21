import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isCheating, setIsCheating] = useState(false);

  // Container dimensions for button movement
  const containerWidth = 300;
  const containerHeight = 150;
  const buttonWidth = 160;
  const buttonHeight = 40;

  const getRandomPosition = () => {
    // Get current position
    const currentX = position.x;
    const currentY = position.y;

    // Generate new position ensuring it's different from current
    let newX, newY;
    do {
      newX = Math.floor(Math.random() * (containerWidth - buttonWidth));
      newY = Math.floor(Math.random() * (containerHeight - buttonHeight));
    } while (
      Math.abs(newX - currentX) < 50 &&
      Math.abs(newY - currentY) < 50
    );

    return { x: newX, y: newY };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isCheating && email && password) {
      setIsRunning(true);
      setPosition({ x: 0, y: 0 });

      setTimeout(() => {
        setIsRunning(false);
        console.log('Login attempted with:', { email, password });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsCheating(true);
      setTimeout(() => setIsCheating(false), 2000);
    }
  };

  const handleMouseEnter = () => {
    // Move if either field is empty or invalid
    if (!email.includes('@') || password.length < 1) {
      setPosition(getRandomPosition());
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* Navigation */}
      <Navbar />
      <div className='pb-10'>
      </div>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Please sign in to your account</p>
            <p className="mt-1 text-sm text-gray-500">
              (Hint: Enter a valid email to catch the button!)
            </p>
          </div>

          {isCheating && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>No cheating! Click the button manually 😉</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" autocomplete="off">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div
              className="relative bg-gray-50 rounded-lg p-4"
              style={{ height: containerHeight }}
            >
              <button
                type="submit"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  position: 'absolute',
                  transition: 'transform 0.1s linear'
                }}
                onMouseEnter={handleMouseEnter}
                className={`group relative w-40 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isRunning ? 'bg-green-600' : isCheating ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={isRunning || isCheating}
              >
                {isRunning ? 'Logging in...' : isCheating ? 'Nice try!' : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;