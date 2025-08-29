"use client";

import { useState, useEffect } from 'react';
import JourneyTable from './JourneyTable';
import SettingsForm from './SettingsForm';
// Icons removed as corresponding UI blocks were removed

interface CustomerLocation {
  id: number;
  district: string;
  city: string;
  customerCount: number;
  totalOrders: number;
  totalRevenue: number;
  latitude: number;
  longitude: number;
  topProducts: string[];
}

interface DistrictStats {
  district: string;
  customerCount: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  growthRate: number;
}

export default function CustomerInfoPage() {
  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [districtStats, setDistrictStats] = useState<DistrictStats[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'customer-journey'>('customer-journey');

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer-info');
      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }
      const data = await response.json();
      
      setLocations(data.locations || []);
      setDistrictStats(data.districtStats || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Fallback to mock data if API fails
      const mockLocations: CustomerLocation[] = [
        {
          id: 1,
          district: 'Dhaka',
          city: 'Dhaka City',
          customerCount: 45,
          totalOrders: 120,
          totalRevenue: 85000,
          latitude: 23.8103,
          longitude: 90.4125,
          topProducts: ['Yoga Mat', 'Smart Watch', 'Headphones']
        },
        {
          id: 2,
          district: 'Chittagong',
          city: 'Chittagong City',
          customerCount: 28,
          totalOrders: 75,
          totalRevenue: 52000,
          latitude: 22.3419,
          longitude: 91.8134,
          topProducts: ['Yoga Mat', 'Face Cream', 'T-Shirt']
        }
      ];

      const mockDistrictStats: DistrictStats[] = [
        {
          district: 'Dhaka',
          customerCount: 45,
          totalOrders: 120,
          totalRevenue: 85000,
          avgOrderValue: 708.33,
          growthRate: 15.2
        },
        {
          district: 'Chittagong',
          customerCount: 28,
          totalOrders: 75,
          totalRevenue: 52000,
          avgOrderValue: 693.33,
          growthRate: 12.8
        }
      ];

      setLocations(mockLocations);
      setDistrictStats(mockDistrictStats);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = selectedDistrict === 'all' 
    ? districtStats 
    : districtStats.filter(stat => stat.district === selectedDistrict);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-none">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-none">
        {/* Header removed per request */}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('customer-journey')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customer-journey'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Customer Journey
              </button>
              {/* Abandoned Carts tab removed per request */}
            </nav>
          </div>
        </div>

        {/* Key Metrics removed */}

        {/* Tab Content */}
        {activeTab === 'settings' && (
          <div className="bg-white/60 backdrop-blur rounded-xl shadow border border-gray-200 p-4">
            <SettingsForm />
          </div>
        )}

        {activeTab === 'customer-journey' && (
          <div className="bg-white/60 backdrop-blur rounded-xl shadow border border-gray-200 p-4">
            <JourneyTable />
          </div>
        )}

        {/* Abandoned Carts content removed per request */}
      </div>
    </div>
  );
}
