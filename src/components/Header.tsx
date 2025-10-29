import { Search } from 'lucide-react';
import type { View } from '../types';

type Props = {
  view: View;
  setView: (v: View) => void;
};

export default function Header({ view, setView }: Props) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lost & Found Hub
              </h1>
              <p className="text-sm text-gray-600">Reuniting people with their belongings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setView('browse')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                view === 'browse'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Browse Items
            </button>
            <button
              onClick={() => setView('post')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                view === 'post'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Post Item
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
