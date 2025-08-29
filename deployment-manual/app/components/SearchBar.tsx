"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/pixelTracking';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ placeholder = "Search products...", className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Track unified Search event (client+server with dedup)
    try {
      await trackEvent('Search', {
        search_string: searchQuery,
        content_category: 'search',
        content_type: 'search'
      });
    } catch {}

    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        🔍
      </button>
    </form>
  );
}
