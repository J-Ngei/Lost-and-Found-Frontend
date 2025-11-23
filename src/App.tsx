import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { categories as CATEGORIES } from './constants';
import type { Filter, FormData, Item, View, User } from './types';

// Lazy load components
const Header = lazy(() => import('./components/Header'));
const FiltersBar = lazy(() => import('./components/FiltersBar'));
const StatsCards = lazy(() => import('./components/StatsCards'));
const ItemCard = lazy(() => import('./components/ItemCard'));
const ItemModal = lazy(() => import('./components/ItemModal'));
const PostForm = lazy(() => import('./components/PostForm'));
const AuthModal = lazy(() => import('./components/AuthModal'));

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

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function LostFoundHub() {
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<View>('browse');
  const [filter, setFilter] = useState<Filter>({ type: 'all', category: 'all' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPost, setPendingPost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      const res = await fetch(api('/api/items'), {
        headers: {
          'Cache-Control': 'max-age=300', // 5 minute cache
        },
      });
      
      if (!res.ok) {
        // If we get a 404, it means no items exist yet (which is fine)
        if (res.status === 404) {
          setItems([]);
          setError(null); // Explicitly clear error for empty state
          return;
        }
        throw new Error(`Server responded with status: ${res.status}`);
      }
      
      const json = await res.json();
      
      // If we get here, the request was successful
      // Handle both array responses and empty responses
      const itemsData = Array.isArray(json?.data) ? json.data : [];
      const mapped = itemsData.map((it: any) => ({ ...it, id: it._id }));
      setItems(mapped as Item[]);
      setError(null); // Clear any previous errors on success
      
    } catch (err) {
      console.error('Error fetching items:', err);
      // Only show error if we don't have any items yet
      if (items.length === 0) {
        setError('Failed to load items. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [items.length]);

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

  const handleResolve = (id: string | number) => {
    fetch(api(`/api/items/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.apiKey ? { Authorization: `Bearer ${user.apiKey}` } : {}),
      },
      body: JSON.stringify({ status: 'resolved' }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setItems((prev) => prev.filter((it) => it.id !== id));
          setSelectedItem(null);
        } else {
          alert('Failed to resolve item');
        }
      })
      .catch(() => alert('Failed to resolve item'));
  };

  const handleDelete = (id: string | number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    fetch(api(`/api/items/${id}`), { method: 'DELETE', headers: { ...(user?.apiKey ? { Authorization: `Bearer ${user.apiKey}` } : {}) } })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setItems((prev) => prev.filter((it) => it.id !== id));
          setSelectedItem(null);
        } else {
          alert('Failed to delete item');
        }
      })
      .catch(() => alert('Failed to delete item'));
  };

  const filteredItems = items.filter((item) => {
    const matchesType = filter.type === 'all' || item.type === filter.type;
    const matchesCategory = filter.category === 'all' || item.category === filter.category;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q);
    const matchesStatus = !onlyActive || item.status === 'active';
    return matchesType && matchesCategory && matchesSearch && matchesStatus;
  });

  const handleSubmit = () => {
    if (!user) {
      setPendingPost(true);
      setShowAuth(true);
      return;
    }
    if (!formData.category || !formData.title || !formData.description || !formData.location || !formData.contact) {
      alert('Please fill in all required fields');
      return;
    }
    // Submit to backend with multipart/form-data
    const body = new FormData();
    body.append('type', formData.type);
    body.append('category', formData.category);
    body.append('title', formData.title);
    body.append('description', formData.description);
    body.append('date', formData.date);
    body.append('location', formData.location);
    body.append('contact', formData.contact);
    if (formData.reward) body.append('reward', formData.reward);
    if (formData.imageFile) body.append('image', formData.imageFile);

    fetch(api('/api/items'), { 
      method: 'POST', 
      body, 
      headers: { 
        'Authorization': `Bearer ${user.apiKey}`,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      },
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || 'Failed to post item');
        }
        return json;
      })
      .then((json) => {
        if (json?.success && json?.data) {
          const saved = { ...(json.data as any), id: json.data._id } as Item;
          setItems(prevItems => [saved, ...prevItems]);
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
          setView('browse');
        } else {
          throw new Error(json?.error || 'Failed to post item');
        }
      })
      .catch((error) => {
        console.error('Error posting item:', error);
        alert(error.message || 'Failed to post item. Please check the console for more details.');
      });

  };

  const setViewGuard = (v: View) => {
    if (v === 'post' && !user) {
      setPendingPost(true);
      setShowAuth(true);
      return;
    }
    setView(v);
  };

  const handleSignIn = () => setShowAuth(true);
  const handleSignOut = () => {
    setUser(null);
    try { localStorage.removeItem('lf_user'); } catch {}
    if (view === 'post') setView('browse');
  };
  const handleRotateKey = async () => {
    if (!user) return;
    try {
      const res = await fetch(api(`/api/users/${user.userId}/rotate-key`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.apiKey}` },
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Failed to rotate key');
      setUser(json.data);
      try { localStorage.setItem('lf_user', JSON.stringify(json.data)); } catch {}
      alert('API key rotated successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to rotate key');
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
            setView={setViewGuard}
            user={user}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onRotateKey={handleRotateKey}
          />
        </Suspense>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && items.length === 0 && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error} <button onClick={fetchItems} className="underline ml-2">Retry</button>
            </div>
          )}
          
          <Suspense fallback={<LoadingSpinner />}>
            {view === 'browse' ? (
              <>
                <Suspense fallback={<div className="h-20 bg-gray-50 rounded-lg mb-6"></div>}>
                  <FiltersBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filter={filter}
                    setFilter={(f) => {
                      setOnlyActive(false);
                      setFilter(f);
                    }}
                    categories={CATEGORIES}
                  />
                </Suspense>

                <Suspense fallback={<div className="h-40 bg-gray-50 rounded-xl mb-8"></div>}>
                  <StatsCards
                    items={items}
                    onSelect={(key) => {
                      if (key === 'active') {
                        setOnlyActive(true);
                        setFilter((prev) => ({ ...prev, type: 'all' }));
                      } else {
                        setOnlyActive(false);
                        setFilter((prev) => ({ ...prev, type: key }));
                      }
                    }}
                  />
                </Suspense>

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full">
                    {filteredItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {filteredItems.map((item) => (
                          <Suspense key={item.id} fallback={<div className="h-64 bg-gray-100 rounded-lg"></div>}>
                            <ItemCard
                              item={item}
                              onClick={() => setSelectedItem(item)}
                            />
                          </Suspense>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md mx-auto">
                          <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <h3 className="mt-2 text-lg font-medium text-gray-900">
                            {searchTerm
                              ? 'No items match your search'
                              : 'No items found'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm
                              ? 'Try adjusting your search or filter to find what you\'re looking for.'
                              : 'There are currently no items listed. Be the first to post a lost or found item!'}
                          </p>
                          <div className="mt-6">
                            <button
                              type="button"
                              onClick={() => {
                                setView('post');
                                if (!user) {
                                  setPendingPost(true);
                                  setShowAuth(true);
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              {searchTerm ? 'Clear search and post new' : 'Post a new item'}
                            </button>
                          </div>
                          {searchTerm && (
                            <div className="mt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
                                  setFilter({ type: 'all', category: 'all' });
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                              >
                                Or clear all filters
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                <PostForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  categories={CATEGORIES} 
                  onSubmit={handleSubmit}
                />
              </Suspense>
            )}
          </Suspense>
        </main>

        {selectedItem && (
          <Suspense fallback={null}>
            <ItemModal
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onResolve={() => handleResolve(selectedItem.id)}
              onDelete={() => handleDelete(selectedItem.id)}
              canManage={!!user && !!selectedItem.ownerId && String(selectedItem.ownerId) === String(user.userId)}
            />
          </Suspense>
        )}

        {showAuth && (
          <Suspense fallback={null}>
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              onSuccess={(u) => {
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