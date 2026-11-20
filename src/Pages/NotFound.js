import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, Home, LayoutDashboard } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <Compass className="h-10 w-10" />
        </span>
        <p className="mt-6 text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          We could not find that page
        </h1>
        <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
          The link may be broken, or the page may have moved. Check the URL or use one of the
          shortcuts below.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-primary">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/courses" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> Browse courses
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="btn-secondary">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
