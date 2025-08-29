'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CustomerTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone: string;
}

interface CustomerData {
  phone: string;
  totalParcels: number;
  successParcels: number;
  cancelledParcels: number;
  successRate: number;
}

interface CourierPerformance {
  pathao: { total: number; success: number; cancel: number };
  steadfast: { total: number; success: number; cancel: number };
  parceldex: { total: number; success: number; cancel: number };
  redx: { total: number; success: number; cancel: number };
  paperfly: { total: number; success: number; cancel: number };
}

interface OrderHistory {
  id: number;
  orderNo: string;
  status: string;
  total: number;
  createdAt: string;
  consignmentId?: string;
}

interface TrackingResponse {
  customer: CustomerData;
  courierPerformance: CourierPerformance;
  courierData: any;
  orders: OrderHistory[];
}

export default function CustomerTrackingModal({ 
  isOpen, 
  onClose, 
  customerPhone 
}: CustomerTrackingModalProps) {
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerPhone) {
      loadCustomerTracking();
    }
  }, [isOpen, customerPhone]);

  const loadCustomerTracking = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bd-courier/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: customerPhone }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load customer tracking data');
      }
    } catch (error) {
      console.error('Error loading customer tracking:', error);
      setError('Failed to load customer tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const nextSibling = target.nextSibling as HTMLElement;
    if (nextSibling) {
      nextSibling.style.display = 'flex';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 p-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Tracking</h2>
            <p className="text-gray-600">Phone: {customerPhone}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer tracking data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">⚠️ {error}</div>
            <button
              onClick={loadCustomerTracking}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : trackingData ? (
          <div className="space-y-5">
            {/* Top Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">Total Orders</h3>
                <p className="text-2xl font-bold text-blue-900">{trackingData.customer.totalParcels}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Successful</h3>
                <p className="text-2xl font-bold text-green-900">{trackingData.customer.successParcels}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800">Cancelled</h3>
                <p className="text-2xl font-bold text-red-900">{trackingData.customer.cancelledParcels}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800">Success Rate</h3>
                <p className="text-2xl font-bold text-purple-900">{trackingData.customer.successRate}%</p>
              </div>
            </div>

            {/* Courier Performance Table and Chart Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-4">
              {/* Left Side - Compact Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
                  <h3 className="text-sm font-semibold text-white">Courier Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Courier
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          T
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          S
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          C
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src="https://bdcourier.com/c-logo/pathao-logo.png" 
                              alt="Pathao" 
                              className="h-6 w-6 rounded mr-2"
                              onError={handleImageError}
                            />
                            <div className="h-6 w-6 bg-blue-100 rounded flex items-center justify-center mr-2 hidden">
                              <span className="text-blue-600 font-bold text-xs">P</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">Pathao</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.pathao.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.pathao.success}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.pathao.cancel}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src="https://bdcourier.com/c-logo/steadfast-logo.png" 
                              alt="SteadFast" 
                              className="h-6 w-6 rounded mr-2"
                              onError={handleImageError}
                            />
                            <div className="h-6 w-6 bg-green-100 rounded flex items-center justify-center mr-2 hidden">
                              <span className="text-green-600 font-bold text-xs">S</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">SteadFast</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.steadfast.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.steadfast.success}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.steadfast.cancel}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src="https://bdcourier.com/c-logo/parceldex-logo.png" 
                              alt="ParcelDex" 
                              className="h-6 w-6 rounded mr-2"
                              onError={handleImageError}
                            />
                            <div className="h-6 w-6 bg-purple-100 rounded flex items-center justify-center mr-2 hidden">
                              <span className="text-purple-600 font-bold text-xs">P</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">ParcelDex</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.parceldex.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.parceldex.success}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.parceldex.cancel}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src="https://bdcourier.com/c-logo/redx-logo.png" 
                              alt="REDX" 
                              className="h-6 w-6 rounded mr-2"
                              onError={handleImageError}
                            />
                            <div className="h-6 w-6 bg-red-100 rounded flex items-center justify-center mr-2 hidden">
                              <span className="text-red-600 font-bold text-xs">R</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">REDX</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.redx.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.redx.success}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.redx.cancel}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              src="https://bdcourier.com/c-logo/paperfly-logo.png" 
                              alt="PAPERFLY" 
                              className="h-6 w-6 rounded mr-2"
                              onError={handleImageError}
                            />
                            <div className="h-6 w-6 bg-orange-100 rounded flex items-center justify-center mr-2 hidden">
                              <span className="text-orange-600 font-bold text-xs">P</span>
                            </div>
                            <span className="text-xs font-medium text-gray-900">PAPERFLY</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.paperfly.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.paperfly.success}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.courierPerformance.paperfly.cancel}
                        </td>
                      </tr>
                      {/* Total Row */}
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          Total
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.customer.totalParcels}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.customer.successParcels}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {trackingData.customer.cancelledParcels}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side - Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Donut Chart */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Success Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="8"
                        strokeDasharray={`${(trackingData.customer.successParcels / trackingData.customer.totalParcels) * 251.2} 251.2`}
                        strokeDashoffset="0"
                      />
                      {/* Cancelled Arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="8"
                        strokeDasharray={`${(trackingData.customer.cancelledParcels / trackingData.customer.totalParcels) * 251.2} 251.2`}
                        strokeDashoffset={`-${(trackingData.customer.successParcels / trackingData.customer.totalParcels) * 251.2}`}
                      />
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {trackingData.customer.successRate}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Successful ({trackingData.customer.successParcels})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Cancelled ({trackingData.customer.cancelledParcels})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BD Courier Summary */}
            {trackingData.courierData && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">BD Courier Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800">Total Parcels</h4>
                    <p className="text-2xl font-bold text-blue-900">{trackingData.customer.totalParcels}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800">Success Rate</h4>
                    <p className="text-2xl font-bold text-green-900">{trackingData.customer.successRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order History Section */}
            {trackingData.orders && trackingData.orders.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Courier ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trackingData.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderNo}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'in-courier' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              order.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {order.total} BDT
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {order.consignmentId ? (
                              <span className="text-purple-600 font-mono bg-purple-50 px-2 py-1 rounded text-xs">
                                {order.consignmentId}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-4 flex justify-end p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
