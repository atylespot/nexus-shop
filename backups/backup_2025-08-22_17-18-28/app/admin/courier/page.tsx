'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CourierOrder {
  id: number;
  orderId: number;
  consignmentId: string;
  trackingCode: string;
  courierStatus: string;
  courierNote: string;
  deliveryCharge?: number;
  createdAt: string;
  order: {
    orderNo: string;
    customerName: string;
    phone: string;
    address: string;
    total: number;
    status: string;
  };
}

export default function CourierOrdersPage() {
  const [courierOrders, setCourierOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadCourierOrders();
  }, []);

  const loadCourierOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courier/orders');
      if (response.ok) {
        const data = await response.json();
        setCourierOrders(data.data || []);
      } else {
        toast.error('Failed to load courier orders');
      }
    } catch (error) {
      console.error('Error loading courier orders:', error);
      toast.error('Failed to load courier orders');
    } finally {
      setLoading(false);
    }
  };

  const updateCourierStatus = async (orderId: number) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/courier/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Status updated: ${data.data.status}`);
        loadCourierOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating courier status:', error);
      toast.error('Failed to update courier status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_review':
        return 'In Review';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2">

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading courier orders...</p>
            </div>
          ) : courierOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No courier orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-green-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '18%' }}>
                      Order Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '20%' }}>
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '25%' }}>
                      Courier Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '12%' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '15%' }}>
                      Delivery Charge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ width: '10%' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {courierOrders.map((courierOrder) => (
                    <tr key={courierOrder.id} className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            #{courierOrder.order.orderNo}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(courierOrder.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {courierOrder.order.total} BDT
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {courierOrder.order.customerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {courierOrder.order.phone}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {courierOrder.order.address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {courierOrder.consignmentId && (
                            <div className="text-xs text-gray-900">
                              <span className="font-medium">Consignment:</span> {courierOrder.consignmentId}
                            </div>
                          )}
                          {courierOrder.trackingCode && (
                            <div className="text-xs text-gray-900">
                              <span className="font-medium">Tracking:</span> {courierOrder.trackingCode}
                            </div>
                          )}
                          {courierOrder.courierNote && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {courierOrder.courierNote}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(courierOrder.courierStatus)}`}>
                          {getStatusLabel(courierOrder.courierStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {courierOrder.deliveryCharge ? (
                          <span className="text-green-600 font-medium">
                            {courierOrder.deliveryCharge} BDT
                          </span>
                        ) : (
                          <span className="text-gray-400">Calculating...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => updateCourierStatus(courierOrder.orderId)}
                          disabled={isUpdatingStatus}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {isUpdatingStatus ? 'Updating...' : '🔄 Update Status'}
                        </button>
                        <button
                          onClick={() => setSelectedOrder(courierOrder)}
                          className="text-green-600 hover:text-green-900 ml-3"
                        >
                          👁️ View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Courier Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Courier Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Order Information</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order Number:</span>
                      <p className="font-medium">#{selectedOrder.order.orderNo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <p className="font-medium">{selectedOrder.order.total} BDT</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Status:</span>
                      <p className="font-medium">{selectedOrder.order.status}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedOrder.order.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedOrder.order.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <p className="font-medium">{selectedOrder.order.address}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Courier Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    {selectedOrder.consignmentId && (
                      <div>
                        <span className="text-gray-500">Consignment ID:</span>
                        <p className="font-medium">{selectedOrder.consignmentId}</p>
                      </div>
                    )}
                    {selectedOrder.trackingCode && (
                      <div>
                        <span className="text-gray-500">Tracking Code:</span>
                        <p className="font-medium">{selectedOrder.trackingCode}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(selectedOrder.courierStatus)}`}>
                        {getStatusLabel(selectedOrder.courierStatus)}
                      </span>
                    </div>
                    {selectedOrder.courierNote && (
                      <div>
                        <span className="text-gray-500">Note:</span>
                        <p className="font-medium">{selectedOrder.courierNote}</p>
                      </div>
                    )}
                    {selectedOrder.deliveryCharge && (
                      <div>
                        <span className="text-gray-500">Delivery Charge:</span>
                        <p className="font-medium text-green-600">{selectedOrder.deliveryCharge} BDT</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
