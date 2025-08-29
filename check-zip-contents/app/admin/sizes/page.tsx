"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Size {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sizes');
      if (response.ok) {
        const data = await response.json();
        setSizes(data);
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSize ? `/api/sizes/${editingSize.id}` : '/api/sizes';
      const method = editingSize ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingSize(null);
        setFormData({ name: '', description: '', isActive: true });
        fetchSizes();
      }
    } catch (error) {
      console.error('Error saving size:', error);
    }
  };

  const handleEdit = (size: Size) => {
    setEditingSize(size);
    setFormData({
      name: size.name,
      description: size.description || '',
      isActive: size.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this size?')) {
      try {
        const response = await fetch(`/api/sizes/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchSizes();
        }
      } catch (error) {
        console.error('Error deleting size:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingSize(null);
    setFormData({ name: '', description: '', isActive: true });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Size Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Size
        </button>
      </div>

      {/* Sizes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sizes.map((size) => (
          <div
            key={size.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              size.isActive ? 'border-green-500' : 'border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{size.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  size.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {size.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {size.description && (
              <p className="text-gray-600 mb-4">{size.description}</p>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Created: {new Date(size.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(size)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(size.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingSize ? 'Edit Size' : 'Create New Size'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingSize ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
