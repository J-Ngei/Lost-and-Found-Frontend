import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { categories } from './constants';

// Categories are now imported where needed
// Define types at the top of the file
interface User {
  _id: string;
  name: string;
  email: string;
  apiKey: string;
}

interface Item {
  _id: string;
  type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  location: string;
  date: string;
  contact: string;
  reward?: string;
  image?: string;
  status: 'active' | 'resolved';
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  // Add id as an alias for _id for backward compatibility
  id?: string;
}

interface Filter {
  type: 'all' | 'lost' | 'found';
  category: string;
}

type View = 'browse' | 'post' | 'item';

interface FormData {
  type: 'lost' | 'found';
  category: string;
  title: string;
  description: string;
  location: string;
  date: string;
  contact: string;
  reward: string;
  image: string | null;
  imageFile: File | null;
}

// Lazy load components with prefetching
const lazyWithPreload = (importFn: () => Promise<any>) => {
  const Component = lazy(importFn);
  (Component as any).preload = importFn;
  return Component;
};

const Header = lazyWithPreload(() => import('./components/Header'));
const StatsCards = lazyWithPreload(() => import('./components/StatsCards'));
const ItemCard = lazyWithPreload(() => import('./components/ItemCard'));
const ItemModal = lazyWithPreload(() => import('./components/ItemModal'));
const PostForm = lazyWithPreload(() => import('./components/PostForm'));
const AuthModal = lazyWithPreload(() => import('./components/AuthModal'));

// Preload components on user interaction
const preloadComponents = () => {
  [Header, StatsCards, ItemCard, ItemModal, PostForm, AuthModal].forEach(
    (component: any) => component.preload?.()
  );
};

// Utility function to handle API paths
function api(path: string): string {
  return path.startsWith('http') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg m-4">
      <p>Something went wrong:</p>
      <pre className="whitespace-pre-wrap my-2">{error.message}</pre>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md"
      >
        Try again
      </button>
    </div>
  );
}

export default function LostFoundHub() {
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<View>('browse');
  const [filter, setFilter] = useState<Filter>({ type: 'all', category: 'all' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: 'lost',
    category: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    contact: '',
    reward: '',
    image: null,
    imageFile: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items from backend on mount
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = api('/items');
      console.log('Fetching items from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(user?.apiKey ? { 'Authorization': `Bearer ${user.apiKey}` } : {})
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || 'Failed to fetch items');
      }
      
      const data = await response.json();
      console.log('Fetched items:', data);
      setItems(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.apiKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Load user from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lf_user');
      if (raw && raw !== 'undefined') {
        const parsed = JSON.parse(raw);
        // Check for both userId and _id for backward compatibility
        if (parsed?.apiKey && (parsed?.userId || parsed?._id)) {
          // Ensure we have all required fields with consistent property names
          setUser({
            _id: parsed._id || parsed.userId,
            name: parsed.name || '',
            email: parsed.email || '',
            apiKey: parsed.apiKey
          });
        }
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      // Clear invalid user data
      localStorage.removeItem('lf_user');
    }
  }, []);

  // Preload components after initial render
  useEffect(() => {
    const timer = setTimeout(preloadComponents, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleResolve = async (id: string | number) => {
    if (!user?.apiKey) return;
    
    try {
      const response = await fetch(api(`/api/items/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.apiKey}`,
        },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item._id !== id));
        if (selectedItem?._id === id) {
          setSelectedItem(null);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to resolve item');
      }
    } catch (error) {
      console.error('Error resolving item:', error);
      alert('Failed to resolve item. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      // Implement login logic here
      console.log('Login required');
      return;
    }

    // Validate required fields
    if (!formData.category || !formData.title || !formData.description || !formData.location || !formData.contact) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contact', formData.contact);
      if (formData.reward) {
        formDataToSend.append('reward', formData.reward);
      }
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch(api('/items'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post item');
      }

      const newItem = await response.json();
      
      // Update the items list
      setItems(prevItems => [newItem.data, ...prevItems]);
      
      // Reset form
      setFormData({
        type: 'lost',
        category: '',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        contact: '',
        reward: '',
        image: null,
        imageFile: null,
      });
      
      // Switch to browse view
      setView('browse');
      
      alert('Item posted successfully!');
    } catch (error) {
      console.error('Error posting item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to post item. Please try again.';
      alert(errorMessage);
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handlePostClick = () => {
    setView('post');
  };

  const handleLoginClick = () => {
    // Implement login logic here
    console.log('Login clicked');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lf_user');
  };

  const handleDeleteItem = async (id: string) => {
    if (!user?.apiKey || !confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(api(`/api/items/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
        },
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item._id !== id));
        if (selectedItem?._id === id) {
          setSelectedItem(null);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = filter.type === 'all' || item.type === filter.type;
    const matchesCategory = filter.category === 'all' || item.category === filter.category;
    return matchesType && matchesCategory;
  });

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<div className="min-h-screen bg-gray-50">Loading...</div>}>
        <div className="min-h-screen bg-gray-50">
          <Header
            user={user}
            onLogout={handleLogout}
            onLoginClick={handleLoginClick}
            onPostClick={handlePostClick}
          />
          <main className="container mx-auto px-4 py-8">
            {view === 'browse' && (
              <div>
                <StatsCards items={items} />
                <div className="mt-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {filter.type === 'all' ? 'All Items' : filter.type === 'lost' ? 'Lost Items' : 'Found Items'}
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="lost">Lost Items</option>
                        <option value="found">Found Items</option>
                      </select>
                      <select
                        value={filter.category}
                        onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map((item) => (
                        <ItemCard
                          key={item._id || item.id}
                          item={item}
                          onClick={handleItemClick}
                          onDelete={handleDeleteItem}
                          currentUserId={user?._id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {filter.type === 'all' ? 'There are no items to display.' : `No ${filter.type} items found.`}
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handlePostClick}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Post an Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {view === 'post' && (
              <PostForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleSubmit}
              />
            )}
          </main>
          {isModalOpen && selectedItem && (
            <ItemModal
              item={selectedItem}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedItem(null);
              }}
              onResolve={() => {
                handleResolve(selectedItem._id || selectedItem.id || '');
                setIsModalOpen(false);
                setSelectedItem(null);
              }}
              onDelete={() => {
                handleDeleteItem(selectedItem._id || selectedItem.id || '');
                setIsModalOpen(false);
                setSelectedItem(null);
              }}
              canManage={user?._id === selectedItem.ownerId}
            />
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}