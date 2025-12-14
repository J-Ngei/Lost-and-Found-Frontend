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
  const [searchTerm, setSearchTerm] = useState<string>('');
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

  // Fetch items from backend on mount
  const fetchItems = useCallback(async () => {
    // ...
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Load user from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lf_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.apiKey && parsed?.userId) setUser(parsed);
      }
    } catch {}
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
                  onSelect={(type) => {
                    if (type === 'active') {
                      setFilter(prev => ({ ...prev, type: 'all' }));
                    } else {
                      setFilter(prev => ({ ...prev, type }));
                    }
                  }} 
                />
              </Suspense>
              <h2 className="text-2xl font-bold mb-4">Browse Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items
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
                  ))}
              </div>
            </div>
          )}
          
          {view === 'post' && (
            <Suspense fallback={<div>Loading form...</div>}>
              <PostForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={() => {
                  // Handle form submission
                  console.log('Form submitted:', formData);
                  // Add your form submission logic here
                }}
              />
            </Suspense>
          )}
        </main>

        {selectedItem && (
          <Suspense fallback={null}>
            <ItemModal
              item={selectedItem}
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