"use client";

import { useState, useEffect } from "react";

type Category = {
  id: string;
  name: string;
  type: string;
  icon?: string;
  isDefault: boolean;
  _count: { transactions: number };
  children?: Category[];
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      
      // Use only parent categories (no subcategories)
      const parents: Category[] = data;

      // Sort by transaction count by default
      parents.sort((a: Category, b: Category) => b._count.transactions - a._count.transactions);
      
      setCategories(parents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast(`Category "${name}" deleted successfully!`, 'success');
        fetchCategories();
      } else {
        showToast(data.error || "Failed to delete category", 'error');
      }
    } catch (err) {
      showToast("Network error occurred", 'error');
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
      </div>
      
      <div className="flex-1 max-w-4xl w-full">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">All Categories</h2>
          <p className="text-sm text-gray-500 mb-6">
            Categories are sorted by how often you use them. You can delete custom categories that you no longer need.
          </p>

          {loading ? (
            <div className="skeleton h-64 w-full"></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Type</th>
                    <th>Usage Count</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium flex items-center gap-2 whitespace-pre">
                        <span>{c.icon}</span> {c.name}
                      </td>
                      <td>
                        <span className={`badge ${c.type === 'expense' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {c._count.transactions} transactions
                      </td>
                      <td>
                        {c.isDefault ? (
                          <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">System Default</span>
                        ) : (
                          <span className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full">Custom</span>
                        )}
                      </td>
                      <td className="text-right">
                        {!c.isDefault && (
                          <button
                            onClick={() => handleDelete(c.id, c.name.trim())}
                            className="btn-danger p-2 h-auto"
                            title="Delete category"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">
                        No categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'border-red-500' : 'border-emerald-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
            <p className="font-medium text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
