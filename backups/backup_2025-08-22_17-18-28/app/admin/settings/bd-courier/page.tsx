'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BDCourierSetting {
  id?: number;
  apiKey: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function BDCourierSettingsPage() {
  const [settings, setSettings] = useState<BDCourierSetting>({
    apiKey: '',
    isActive: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/bd-courier');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading BD Courier settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.apiKey.trim()) {
      toast.error('API Key is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/bd-courier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('BD Courier settings saved successfully');
        await loadSettings();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving BD Courier settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testAPI = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number to test');
      return;
    }

    if (!settings.apiKey.trim()) {
      toast.error('Please save API key first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/bd-courier/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: testPhone }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
        toast.success('API test completed successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'API test failed');
        setTestResult(null);
      }
    } catch (error) {
      console.error('Error testing BD Courier API:', error);
      toast.error('API test failed');
      setTestResult(null);
    } finally {
      setIsTesting(false);
    }
  };

  const regenerateAPIKey = () => {
    const newKey = 'bd_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSettings(prev => ({ ...prev, apiKey: newKey }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BD Courier settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BD Courier Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure BD Courier API integration for customer tracking and performance analytics
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">API Configuration</h2>
          
          <div className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your BD Courier API key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={regenerateAPIKey}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                >
                  Regenerate
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your secret API key for authenticating with BD Courier services
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={settings.isActive}
                onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Enable BD Courier integration
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* API Test Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Test API Connection</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Phone Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={testAPI}
                  disabled={isTesting || !settings.apiKey.trim()}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {isTesting ? 'Testing...' : 'Test API'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter a phone number to test the BD Courier API connection
              </p>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Test Results</h3>
                <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">API Documentation</h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900">Endpoint</h3>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://bdcourier.com/api/courier-check</code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Method</h3>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST</code>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Parameters</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>phone:</strong> The phone number for which courier data is requested</li>
                <li><strong>Authorization:</strong> Bearer token for API access</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Sample Request</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "phone": "017xxxxxxxx"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

