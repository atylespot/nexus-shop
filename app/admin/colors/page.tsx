"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Color {
  id: string;
  name: string;
  hexCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#000000',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/colors');
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingColor ? `/api/colors/${editingColor.id}` : '/api/colors';
      const method = editingColor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingColor(null);
        setFormData({ name: '', hexCode: '#000000', description: '', isActive: true });
        fetchColors();
      }
    } catch (error) {
      console.error('Error saving color:', error);
    }
  };

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hexCode: color.hexCode,
      description: color.description || '',
      isActive: color.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this color?')) {
      try {
        const response = await fetch(`/api/colors/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchColors();
        }
      } catch (error) {
        console.error('Error deleting color:', error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingColor(null);
    setFormData({ name: '', hexCode: '#000000', description: '', isActive: true });
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
        <h1 className="text-3xl font-bold text-gray-900">Color Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Color
        </button>
      </div>

      {/* Colors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color) => (
          <div
            key={color.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              color.isActive ? 'border-green-500' : 'border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: color.hexCode }}
                ></div>
                <h3 className="text-xl font-semibold text-gray-900">{color.name}</h3>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  color.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {color.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="text-sm text-gray-600 font-mono">{color.hexCode}</span>
            </div>
            
            {color.description && (
              <p className="text-gray-600 mb-4">{color.description}</p>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Created: {new Date(color.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(color)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(color.id)}
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
              {editingColor ? 'Edit Color' : 'Create New Color'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Red, Blue, Green"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Code *
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.hexCode}
                    onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={formData.hexCode}
                    onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#000000"
                  />
                </div>
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
                  {editingColor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
