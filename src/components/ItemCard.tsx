import { Calendar, MapPin } from 'lucide-react';
import type { Item } from '../types';
import { getDaysAgo } from '../utils/date';
import { fileUrl } from '../utils/api';

type Props = {
  item: Item;
  onClick: (item: Item) => void;
};

export default function ItemCard({ item, onClick }: Props) {
  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative">
        <img src={fileUrl(item.image || '')} alt={item.title} className="w-full h-48 object-cover" />
        <div
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
            item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {item.type.toUpperCase()}
        </div>
        {item.reward && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">
            Reward: {item.reward}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{item.category}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            {item.location}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            {getDaysAgo(item.date)}
          </div>
        </div>
      </div>
    </div>
  );
}
