import { useEffect, useState } from 'react';
import Header from './components/Header';
import FiltersBar from './components/FiltersBar';
import StatsCards from './components/StatsCards';
import ItemCard from './components/ItemCard';
import ItemModal from './components/ItemModal';
import PostForm from './components/PostForm';
import { AlertCircle } from 'lucide-react';
import { categories as CATEGORIES } from './constants';
import { api } from './utils/api';
import type { Filter, FormData, Item, View } from './types';

export default function LostFoundHub() {
  const [items, setItems] = useState<Item[]>([]);

  const [view, setView] = useState<View>('browse');
  const [filter, setFilter] = useState<Filter>({ type: 'all', category: 'all' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
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
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(api('/api/items'));
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const mapped = (json.data as any[]).map((it) => ({ ...it, id: it._id }));
          setItems(mapped as Item[]);
        }
      } catch (_) {
        // keep empty list if request fails
      }
    };
    load();
  }, []);

  const handleResolve = (id: string | number) => {
    fetch(api(`/api/items/${id}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    fetch(api(`/api/items/${id}`), { method: 'DELETE' })
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

    fetch(api('/api/items'), { method: 'POST', body })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json?.data) {
          const saved = { ...(json.data as any), id: json.data._id } as Item;
          setItems([saved, ...items]);
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
          alert('Failed to post item');
        }
      })
      .catch(() => alert('Failed to post item'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header view={view} setView={setView} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'browse' ? (
          <>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        ) : (
          <PostForm formData={formData} setFormData={setFormData} categories={CATEGORIES} onSubmit={handleSubmit} />
        )}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onResolve={() => handleResolve(selectedItem.id)}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      )}
    </div>
  );
}