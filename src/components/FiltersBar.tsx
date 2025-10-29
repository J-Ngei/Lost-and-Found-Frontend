import React from 'react';
import { Search } from 'lucide-react';
import type { Filter } from '../types';

type Props = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  categories: string[];
};

export default function FiltersBar({ searchTerm, setSearchTerm, filter, setFilter, categories }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value as Filter['type'] })}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Items</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
        </select>
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
