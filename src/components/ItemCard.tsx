import { Calendar, MapPin } from 'lucide-react';
import type { Item } from '../types';
import { getDaysAgo } from '../utils/date';
import { fileUrl } from '../utils/api';

type Props = {
  item: Item;
  onClick: (item: Item) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string | null;
};

export default function ItemCard({ item, onClick, onDelete, currentUserId }: Props) {
  const isOwner = currentUserId && item.ownerId && String(item.ownerId) === String(currentUserId);
  
  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="relative">
        {item.image ? (
          <img 
            src={fileUrl(item.image)} 
            alt={item.title} 
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-item.jpg';
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
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
        {isOwner && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this item?')) {
                onDelete(item._id || item.id || '');
              }
            }}
            className="absolute bottom-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            aria-label="Delete item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 whitespace-nowrap ml-2">
            {item.category}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{getDaysAgo(item.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
