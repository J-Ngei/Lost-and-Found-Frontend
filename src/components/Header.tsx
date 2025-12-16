import { memo } from 'react';
import type { View, User } from '../types';

// Memoize header to prevent unnecessary re-renders
const Header = memo(({ view, setView, user, onSignIn, onSignOut }: {
  view: View;
  setView: (v: View) => void;
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}) => {
  // User avatar initialization removed as it wasn't being used
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 md:p-3 rounded-xl">
              <img 
                src="/favicon.png" 
                alt="" 
                width="28" 
                height="28" 
                className="w-7 h-7" 
                loading="eager"
                decoding="async"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                Lost & Found Hub
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Reuniting people with their belongings</p>
            </div>
          </div>
          <nav className="flex gap-2 sm:gap-3 mt-2 md:mt-0 w-full md:w-auto justify-start md:justify-end items-center flex-wrap">
            <button
              onClick={() => setView('browse')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                view === 'browse'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-current={view === 'browse' ? 'page' : undefined}
            >
              Browse Items
            </button>
            <button
              onClick={() => setView('post')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                view === 'post'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-current={view === 'post' ? 'page' : undefined}
            >
              Post Item
            </button>
            {!user ? (
              <button
                onClick={onSignIn}
                className="px-4 py-2 rounded-lg font-medium bg-gray-900 text-white hover:bg-black text-sm sm:text-base whitespace-nowrap"
                aria-label="Sign in to your account"
              >
                Sign in
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div 
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm truncate max-w-[180px] sm:max-w-xs"
                  title={user.name || user.email}
                  aria-label={`Signed in as ${user.name || user.email}`}
                >
                  <span className="sr-only">Signed in as </span>
                  {user.name || user.email}
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={onSignOut}
                    className="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 whitespace-nowrap"
                    aria-label="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
});

// Add display name for better dev tools
Header.displayName = 'Header';

export default Header;
