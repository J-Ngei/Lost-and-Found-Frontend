import { Calendar, MapPin, Mail, Phone, X } from 'lucide-react';
import type { Item } from '../types';
import { getDaysAgo } from '../utils/date';
import { fileUrl } from '../utils/api';

type Props = {
  item: Item;
  onClose: () => void;
  onResolve: () => void;
  onDelete: () => void;
  canManage?: boolean;
};

export default function ItemModal({ item, onClose, onResolve, onDelete, canManage = false }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={fileUrl(item.image || '')} alt={item.title} className="w-full h-64 object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
          <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-semibold ${
            item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {item.type.toUpperCase()}
          </div>
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h2>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{item.category}</span>
            </div>
            {item.reward && (
              <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-semibold">Reward: {item.reward}</div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-3 text-blue-500" />
              <span>
                {getDaysAgo(item.date)} - {new Date(item.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-3 text-blue-500" />
              <span>{item.location}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="flex items-center text-gray-700">
              {item.contact.includes('@') ? (
                <>
                  <Mail className="w-5 h-5 mr-3 text-blue-500" />
                  <a href={`mailto:${item.contact}`} className="hover:underline">{item.contact}</a>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-3 text-blue-500" />
                  <a href={`tel:${item.contact}`} className="hover:underline">{item.contact}</a>
                </>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={onResolve}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Mark as Resolved
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

