import type { Item } from '../types';

type Props = {
  items: Item[];
  onSelect?: (key: 'lost' | 'found' | 'active') => void;
};

export default function StatsCards({ items, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div
        className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 hover:opacity-95"
        role="button"
        tabIndex={0}
        aria-label="View Lost Items"
        onClick={() => onSelect?.('lost')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect?.('lost');
        }}
      >
        <div className="text-3xl font-bold">{items.filter((i) => i.type === 'lost').length}</div>
        <div className="text-red-100">Lost Items</div>
      </div>
      <div
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-300 hover:opacity-95"
        role="button"
        tabIndex={0}
        aria-label="View Found Items"
        onClick={() => onSelect?.('found')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect?.('found');
        }}
      >
        <div className="text-3xl font-bold">{items.filter((i) => i.type === 'found').length}</div>
        <div className="text-green-100">Found Items</div>
      </div>
      <div
        className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 hover:opacity-95"
        role="button"
        tabIndex={0}
        aria-label="View Active Listings"
        onClick={() => onSelect?.('active')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect?.('active');
        }}
      >
        <div className="text-3xl font-bold">{items.filter((i) => i.status === 'active').length}</div>
        <div className="text-blue-100">Active Listings</div>
      </div>
    </div>
  );
}

