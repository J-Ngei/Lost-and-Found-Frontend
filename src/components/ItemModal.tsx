import { Calendar, MapPin, Mail, Phone, X, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { toast } from 'sonner';
import type { Item } from '../types';
import { getDaysAgo } from '../utils/date';
import { fileUrl } from '../utils/api';

interface ImageErrorEvent extends React.SyntheticEvent<HTMLImageElement> {
  target: EventTarget & { src: string };
}

type Props = {
  item: Item;
  onClose: () => void;
  onResolve: () => void;
  onDelete: () => void;
  canManage?: boolean;
};

const getImageUrl = (image: string) => {
  return fileUrl(image || '');
};

const ItemModal = memo(({ item, onClose, onResolve, onDelete, canManage = false }: Props) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Handle escape key press
  useEffect(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastFocusedElement.current?.focus();
    };
  }, [onClose]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleImageError = useCallback((e: ImageErrorEvent) => {
    setIsImageLoading(false);
    e.target.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400';
  }, []);

  const handleResolve = useCallback(() => {
    if (confirm('Are you sure you want to mark this item as resolved?')) {
      try {
        onResolve();
        toast.success(`Item marked as resolved successfully`);
      } catch (error) {
        toast.error('Failed to update item status');
      }
    }
  }, [onResolve]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        onDelete();
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  }, [onDelete]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto outline-none" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="relative w-full h-64 bg-gray-100">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            <img 
              src={getImageUrl(item.image)} 
              alt={item.title} 
              className={`w-full h-full object-cover transition-opacity duration-200 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
          <div 
            className={`absolute top-4 left-4 px-4 py-2 rounded-full font-semibold ${
              item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
            aria-label={`This is a ${item.type} item`}
          >
            {item.type.toUpperCase()}
          </div>
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="item-modal-title" className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h2>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600" aria-label={`Category: ${item.category}`}>
                {item.category}
              </span>
            </div>
            {item.reward && (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold border border-yellow-200">
                <span className="sr-only">Reward: </span>
                {item.reward}
              </div>
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
                onClick={handleResolve}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                aria-label="Mark as resolved"
              >
                Mark as Resolved
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label="Delete item"
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

