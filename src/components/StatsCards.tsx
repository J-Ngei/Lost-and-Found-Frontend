import React from 'react';
import type { Item } from '../types';

type Props = {
  items: Item[];
};

export default function StatsCards({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="text-3xl font-bold">{items.filter((i) => i.type === 'lost').length}</div>
        <div className="text-red-100">Lost Items</div>
      </div>
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="text-3xl font-bold">{items.filter((i) => i.type === 'found').length}</div>
        <div className="text-green-100">Found Items</div>
      </div>
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="text-3xl font-bold">{items.filter((i) => i.status === 'active').length}</div>
        <div className="text-blue-100">Active Listings</div>
      </div>
    </div>
  );
}
