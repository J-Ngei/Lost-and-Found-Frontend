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
  const [searchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPost, setPendingPost] = useState(false);
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
      const response = await fetch(api('/api/items'));
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data.data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setPendingPost(true);
      setShowAuth(true);
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

  const handleDelete = async (id: string) => {
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

  const rotateApiKey = async () => {
    if (!user?.apiKey) return;
    
    if (!confirm('Are you sure you want to rotate your API key? This will invalidate the current key.')) {
      return;
    }

    try {
      const response = await fetch(api(`/api/users/${user._id}/rotate-key`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...user, apiKey: data.apiKey };
        setUser(updatedUser);
        localStorage.setItem('lf_user', JSON.stringify(updatedUser));
        alert('API key rotated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to rotate API key');
      }
    } catch (error) {
      console.error('Error rotating API key:', error);
      alert('Failed to rotate API key. Please try again.');
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Suspense fallback={<div className="h-24 bg-white shadow-sm"></div>}>
          <Header
            view={view}
            setView={(newView: View) => setView(newView)}
            user={user}
            onSignIn={() => setShowAuth(true)}
            onSignOut={() => setUser(null)}
            onRotateKey={rotateApiKey}
          />
        </Suspense>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === 'browse' && (
            <div className="mt-8">
              <Suspense fallback={<div>Loading stats...</div>}>
                <StatsCards 
                  items={items} 
                  onSelect={(type: 'active' | 'lost' | 'found') => {
                    if (type === 'active') {
                      setFilter(prev => ({ ...prev, type: 'all' }));
                    } else {
                      setFilter(prev => ({ ...prev, type }));
                    }
                  }}
                />
              </Suspense>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">Error loading items</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchItems}
                    className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {items.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No items found. Be the first to post one!
                    </div>
                  ) : (
                    items
                      .filter(item => 
                        (filter.type === 'all' || item.type === filter.type) &&
                        (filter.category === 'all' || item.category === filter.category) &&
                        (searchTerm === '' || 
                          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(item => (
                        <div key={item._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <p className="text-gray-600">{item.description}</p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {item.type === 'lost' ? 'Lost' : 'Found'} • {item.category}
                            </span>
                            <button 
                              onClick={() => setSelectedItem(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )
          {view === 'post' && (
            <Suspense fallback={<div>Loading form...</div>}>
              <PostForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleSubmit}
              />
            </Suspense>
          )
          }
        </main>
              onClose={() => setSelectedItem(null)}
              onResolve={() => handleResolve(selectedItem._id)}
              onDelete={() => handleDelete(selectedItem._id)}
              canManage={!!user && !!selectedItem.ownerId && String(selectedItem.ownerId) === String(user._id)}
            />
          </Suspense>
        )}

        {showAuth && (
          <Suspense fallback={null}>
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              onSuccess={(u: User) => {
                setUser(u);
                try { localStorage.setItem('lf_user', JSON.stringify(u)); } catch {}
                if (pendingPost) {
                  setPendingPost(false);
                  setView('post');
                }
              }}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}