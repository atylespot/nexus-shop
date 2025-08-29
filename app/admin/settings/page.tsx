"use client";
import Link from "next/link";

export default function SettingsIndex() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Settings Card */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 ml-3">Site Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure your website's appearance, navigation, and content settings.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Header logo and navigation
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Hero banner and content
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Footer text and social links
            </div>
          </div>
          <Link
            href="/admin/settings/site"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Site Settings
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Pixel Settings Card */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 ml-3">Pixel Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure tracking pixels for Facebook, Instagram, and TikTok advertising.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Meta Pixel (Facebook & Instagram)
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              TikTok Pixel
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Conversion tracking setup
            </div>
          </div>
          <Link
            href="/admin/settings/pixels"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Pixel Settings
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* BD Courier Settings Card */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 ml-3">BD Courier Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure BD Courier API integration for customer tracking and performance analytics.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              API Key configuration
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              Customer performance tracking
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              Courier analytics dashboard
            </div>
          </div>
          <Link
            href="/admin/settings/bd-courier"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage BD Courier Settings
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/settings/general"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">General Settings</h4>
              <p className="text-sm text-gray-500">Site name, language, currency</p>
            </div>
          </Link>

          <Link
            href="/admin/settings/site"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Site Appearance</h4>
              <p className="text-sm text-gray-500">Header, banner, footer</p>
            </div>
          </Link>

          <Link
            href="/admin/settings/pixels"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Tracking Pixels</h4>
              <p className="text-sm text-gray-500">Facebook, TikTok integration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
