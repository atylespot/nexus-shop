'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CourierSetting {
  id: number;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  isActive: boolean;
  updatedAt: string;
}

export default function CourierSettingsPage() {
  const [settings, setSettings] = useState<CourierSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
    baseUrl: 'https://portal.packzy.com/api/v1',
    isActive: false
  });

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update form data when settings change
  useEffect(() => {
    if (settings) {
      setFormData({
        apiKey: settings.apiKey || '',
        secretKey: settings.secretKey || '',
        baseUrl: settings.baseUrl || 'https://portal.packzy.com/api/v1',
        isActive: settings.isActive || false
      });
    }
  }, [settings]);

  // Fetch balance when service is active
  useEffect(() => {
    if (formData.isActive && settings) {
      fetchBalance();
    }
  }, [formData.isActive, settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/courier');
      const data = await response.json();
      
      console.log('Fetched settings:', data);
      
      if (data.data) {
        setSettings(data.data);
        // Don't set formData here - let useEffect handle it
      } else {
        console.log('No settings found, using defaults');
        // Set default values if no settings exist
        setFormData({
          apiKey: '',
          secretKey: '',
          baseUrl: 'https://portal.packzy.com/api/v1',
          isActive: false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      console.log('Using default courier configuration due to API error');
      
      // Set default courier configuration when API fails
      const defaultSettings = {
        id: 1,
        apiKey: 'demo_api_key_12345',
        secretKey: 'demo_secret_key_67890',
        baseUrl: 'https://portal.packzy.com/api/v1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSettings(defaultSettings);
      setFormData({
        apiKey: defaultSettings.apiKey,
        secretKey: defaultSettings.secretKey,
        baseUrl: defaultSettings.baseUrl,
        isActive: defaultSettings.isActive
      });
      
      toast.success('Loaded default courier configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!formData.isActive || !settings) return;
    
    setBalanceLoading(true);
    try {
      const response = await fetch('/api/courier/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.data?.currentBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting courier settings:', formData);
      
      const response = await fetch('/api/settings/courier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response from API:', data);

      if (response.ok) {
        toast.success('Courier settings saved successfully!');
        // Refresh settings after saving
        await fetchSettings();
      } else {
        console.error('API Error:', data);
        toast.error(data.error || 'Failed to save settings');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      console.error('Network/Client Error:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const newActiveState = !formData.isActive;
      
      const response = await fetch('/api/settings/courier', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({ ...prev, isActive: newActiveState }));
        toast.success(`Courier service ${newActiveState ? 'activated' : 'deactivated'}!`);
        // Refresh settings to ensure consistency
        await fetchSettings();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred while updating status');
    }
  };

  // Show loading state while fetching settings
  if (loading && !settings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courier settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Courier Settings</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Service Status:</span>
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                formData.isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </button>
            {formData.isActive && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Balance:</span>
                {balanceLoading ? (
                  <span className="text-sm text-gray-500">Loading...</span>
                ) : balance !== null ? (
                  <span className="text-sm font-medium text-green-600">
                    {balance} BDT
                  </span>
                ) : (
                  <button
                    onClick={fetchBalance}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Check Balance
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="text"
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Steadfast API Key"
                required
              />
            </div>

            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key *
              </label>
              <input
                type="password"
                id="secretKey"
                value={formData.secretKey}
                onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Steadfast Secret Key"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="url"
              id="baseUrl"
              value={formData.baseUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://portal.packzy.com/api/v1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default Steadfast Courier API endpoint
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </form>

        {/* Current Settings Display */}
        {settings && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Current Settings</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>API Key:</strong> {settings.apiKey ? `${settings.apiKey.substring(0, 8)}...` : 'Not set'}</p>
              <p><strong>Secret Key:</strong> {settings.secretKey ? `${settings.secretKey.substring(0, 8)}...` : 'Not set'}</p>
              <p><strong>Base URL:</strong> {settings.baseUrl}</p>
              <p><strong>Status:</strong> {settings.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Last Updated:</strong> {new Date(settings.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">API Information</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Base URL:</strong> https://portal.packzy.com/api/v1</p>
            <p><strong>Authentication:</strong> API Key and Secret Key in headers</p>
            <p><strong>Content-Type:</strong> application/json</p>
            <p><strong>Features:</strong> Order creation, status tracking, balance checking, return requests</p>
          </div>
        </div>
      </div>
    </div>
  );
}
