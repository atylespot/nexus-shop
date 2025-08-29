"use client";
import { useState, useEffect } from "react";
import { 
  Cog6ToothIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

interface ChatBotSettings {
  id: number;
  isEnabled: boolean;
  welcomeMessage: string;
  aiModel: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  autoResponseDelay: number;
  workingHours: any;
  offlineMessage: string;
  openaiApiKey?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactWebsite?: string;
}

export default function ChatSettings() {
  const [settings, setSettings] = useState<ChatBotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/chat/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof ChatBotSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    if (!settings) return;
    const updatedHours = {
      ...settings.workingHours,
      [day]: {
        ...settings.workingHours[day],
        [field]: value
      }
    };
    setSettings({ ...settings, workingHours: updatedHours });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center text-red-600">
        Failed to load chat settings
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
          AI Chat Settings
        </h1>
        <p className="text-gray-600 mt-2">Configure your AI chatbot behavior and responses</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              Basic Configuration
            </h2>

            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Enable AI Chat
                </label>
                <button
                  onClick={() => updateSetting('isEnabled', !settings.isEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter welcome message..."
                />
              </div>

              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={settings.aiModel}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="sk-..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {settings.openaiApiKey ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.openaiApiKey ? "✅ API Key configured" : "⚠️ API Key required for AI chat to work"}
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Contact Information for AI Responses</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => updateSetting('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="support@nexusshop.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settings.contactWhatsApp || ''}
                    onChange={(e) => updateSetting('contactWhatsApp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+8801234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={settings.contactWebsite || ''}
                    onChange={(e) => updateSetting('contactWebsite', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://nexusshop.com"
                  />
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {settings.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.maxTokens}
                  onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower = More focused, Higher = More creative
                </p>
              </div>

              {/* Auto Response Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Response Delay (ms)
                </label>
                <input
                  type="number"
                  value={settings.autoResponseDelay}
                  onChange={(e) => updateSetting('autoResponseDelay', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="5000"
                  step="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-6">
          {/* System Prompt */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Behavior</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter system prompt for AI behavior..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This prompt defines how the AI should behave and respond
              </p>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Working Hours</h2>
            
            <div className="space-y-3">
              {Object.entries(settings.workingHours || {}).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-20">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </label>
                  </div>
                  
                  <input
                    type="time"
                    value={hours.start || "09:00"}
                    onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  
                  <span className="text-gray-500">to</span>
                  
                  <input
                    type="time"
                    value={hours.end || "18:00"}
                    onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  
                  <button
                    onClick={() => updateWorkingHours(day, 'isWorking', !hours.isWorking)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      hours.isWorking
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    {hours.isWorking ? 'Working' : 'Closed'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Message */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Offline Message</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message when offline
              </label>
              <textarea
                value={settings.offlineMessage}
                onChange={(e) => updateSetting('offlineMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter offline message..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
