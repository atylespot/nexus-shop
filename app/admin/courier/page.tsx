'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CourierOrder {
  id: number;
  orderId: number;
  orderType: string;
  consignmentId?: string;
  trackingCode?: string;
  courierStatus: string;
  courierNote?: string;
  deliveryCharge?: number;
  createdAt: string;
  courierResponse?: {
    service?: string;
    orderSource?: string;
    consignment?: {
      consignment_id?: string;
      status?: string;
      created_at?: string;
    };
    orderDetails?: {
      customerName?: string;
      productName?: string;
      deliveryArea?: string;
      address?: string;
    };
    createdAt?: string;
    autoCreated?: boolean;
  };
}

 

export default function CourierOrdersPage() {
  const [courierOrders, setCourierOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [phoneFilter, setPhoneFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'status' | 'payment' | 'manual'>('status');
  const [paymentItems, setPaymentItems] = useState<any[]>([]); // Changed to any[] as PaymentHistoryItem is removed
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentFrom, setPaymentFrom] = useState<string>('');
  const [paymentTo, setPaymentTo] = useState<string>('');
  const [paymentPage, setPaymentPage] = useState<number>(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState<number>(1);
  // Manual payments
  const [manualDate, setManualDate] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualDeliveryCharge, setManualDeliveryCharge] = useState<string>('');
  const [manualCodCharge, setManualCodCharge] = useState<string>('');
  const [manualAdjustment, setManualAdjustment] = useState<string>('');
  const [manualStatementNo, setManualStatementNo] = useState<string>('');
  const [manualNote, setManualNote] = useState<string>('');
  const [manualList, setManualList] = useState<any[]>([]);
  const [manualPage, setManualPage] = useState<number>(1);
  const [manualTotalPages, setManualTotalPages] = useState<number>(1);
  const [savingManual, setSavingManual] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const loadPayments = async () => {
    setPaymentLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentFrom) params.set('from', paymentFrom);
      if (paymentTo) params.set('to', paymentTo);
      params.set('page', String(paymentPage));
      params.set('pageSize', String(pageSize));
      const response = await fetch(`/api/courier/payments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentItems(data.data || []);
        if (data.pagination) setPaymentTotalPages(data.pagination.totalPages || 1);
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'Failed to load payments');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      loadCourierOrders();
    }
  }, [activeTab, statusFilter, phoneFilter, fromDate, toDate, page]);

  useEffect(() => {
    if (activeTab === 'payment') {
      loadPayments();
    }
  }, [activeTab, paymentFrom, paymentTo, paymentPage]);

  useEffect(() => {
    if (activeTab === 'manual') {
      loadManualPayments();
    }
  }, [activeTab, manualPage]);

  useEffect(() => {
    if (!paymentFrom && !paymentTo) {
      const to = new Date();
      const from = new Date(to.getTime() - 60 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      setPaymentFrom(fmt(from));
      setPaymentTo(fmt(to));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadManualPayments = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(manualPage));
      params.set('pageSize', String(pageSize));
      const res = await fetch(`/api/courier/manual-payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setManualList(data.data || []);
        if (data.pagination) setManualTotalPages(data.pagination.totalPages || 1);
      }
    } catch (e) {
      // noop
    }
  };

  const saveManualPayment = async () => {
    if (!manualAmount) return toast.error('Amount is required');
    setSavingManual(true);
    try {
      const res = await fetch('/api/courier/manual-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manualDate || undefined,
          amount: parseFloat(manualAmount),
          deliveryCharge: manualDeliveryCharge ? parseFloat(manualDeliveryCharge) : undefined,
          codCharge: manualCodCharge ? parseFloat(manualCodCharge) : undefined,
          adjustment: manualAdjustment ? parseFloat(manualAdjustment) : undefined,
          statementNo: manualStatementNo || undefined,
          note: manualNote || undefined
        })
      });
      if (res.ok) {
        toast.success('Saved');
        setManualAmount(''); setManualDeliveryCharge(''); setManualCodCharge(''); setManualAdjustment(''); setManualStatementNo(''); setManualNote(''); setManualDate('');
        loadManualPayments();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save');
      }
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSavingManual(false);
    }
  };

  const loadCourierOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (phoneFilter) params.set('phone', phoneFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const response = await fetch(`/api/courier/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCourierOrders(data.data || []);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
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
        {/* Tabs */}
        <div className="mb-3 border-b border-gray-200">
          <nav className="flex gap-2">
            <button
              className={`px-4 py-2 text-sm rounded-t-md ${activeTab==='status' ? 'bg-white border border-b-0 border-gray-200 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('status')}
            >
              Courier Status
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-t-md ${activeTab==='payment' ? 'bg-white border border-b-0 border-gray-200 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('payment')}
            >
              Courier Payment
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-t-md ${activeTab==='manual' ? 'bg-white border border-b-0 border-gray-200 font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual Payment
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'status' ? (
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(e)=>{ setPage(1); setStatusFilter(e.target.value); }} className="border rounded px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in-courier">In Courier</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={phoneFilter} onChange={(e)=>{ setPage(1); setPhoneFilter(e.target.value); }} placeholder="01XXXXXXXXX" className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e)=>{ setPage(1); setFromDate(e.target.value); }} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" value={toDate} onChange={(e)=>{ setPage(1); setToDate(e.target.value); }} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <button onClick={()=>{ setStatusFilter(''); setPhoneFilter(''); setFromDate(''); setToDate(''); setPage(1); }} className="px-3 py-2 bg-gray-100 rounded text-sm">Reset</button>
            </div>
          </div>
        ) : activeTab === 'payment' ? (
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" value={paymentFrom} onChange={(e)=>{ setPaymentPage(1); setPaymentFrom(e.target.value); }} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" value={paymentTo} onChange={(e)=>{ setPaymentPage(1); setPaymentTo(e.target.value); }} className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <button onClick={()=>{ setPaymentFrom(''); setPaymentTo(''); setPaymentPage(1); }} className="px-3 py-2 bg-gray-100 rounded text-sm">Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">Add manual payment entries and manage the list below.</div>
            <button onClick={()=> setManualModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded text-sm">+ Add Manual Payment</button>
          </div>
        )}

        <div className="p-4">
          {activeTab === 'status' ? (
            loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading courier orders...</p>
              </div>
            ) : courierOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No courier orders found</p>
              </div>
            ) : (
              <>
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
                              #{courierOrder.orderType === 'landing_page' ? `LP-${courierOrder.orderId.toString().padStart(6, '0')}` : `ORD-${courierOrder.orderId.toString().padStart(6, '0')}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(courierOrder.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {courierOrder.orderType === 'landing_page' ? 'Landing Page Order' : 'Website Order'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-xs font-medium text-gray-900">
                              {courierOrder.courierResponse?.orderDetails?.customerName || 'Unknown Customer'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {courierOrder.courierResponse?.orderDetails?.productName || 'Unknown Product'}
                            </div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {courierOrder.courierResponse?.orderDetails?.address || 'No Address'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {courierOrder.courierResponse?.consignment?.consignment_id && (
                              <div className="text-xs text-gray-900">
                                <span className="font-medium">Consignment:</span> {courierOrder.courierResponse.consignment.consignment_id}
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
              <div className="mt-3 flex justify-between items-center">
                <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
                <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
                <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
              </div>
              </>
            )
          ) : activeTab === 'payment' ? (
            paymentLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payments...</p>
              </div>
            ) : paymentItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payments found</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-green-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Statement</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Delivered</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Returned</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Delivery Charge</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">COD Charge</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Adjustment</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paymentItems.map((p, idx) => (
                      <tr key={p.id || p.statement_no || `${p.date}-${idx}`} className="border-b border-gray-100">
                        <td className="px-6 py-3 text-xs">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.statement_no || p.invoice_no || '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.delivered_count ?? '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.returned_count ?? '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.delivery_charge != null ? `${p.delivery_charge} BDT` : '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.cod_charge != null ? `${p.cod_charge} BDT` : '-'}</td>
                        <td className="px-6 py-3 text-xs">{p.adjustment != null ? `${p.adjustment} BDT` : '-'}</td>
                        <td className="px-6 py-3 text-xs font-medium text-green-700">{p.amount != null ? `${p.amount} BDT` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={paymentPage<=1} onClick={()=>setPaymentPage(p=>Math.max(1,p-1))}>Prev</button>
                <div className="text-sm text-gray-600">Page {paymentPage} of {paymentTotalPages}</div>
                <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={paymentPage>=paymentTotalPages} onClick={()=>setPaymentPage(p=>Math.min(paymentTotalPages,p+1))}>Next</button>
              </div>
              </>
            )
          ) : (
            <>
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-green-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Statement</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Delivery Charge</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">COD Charge</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Adjustment</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {manualList.map((m: any) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="px-6 py-3 text-xs">{m.date ? new Date(m.date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-3 text-xs">{m.statementNo || '-'}</td>
                      <td className="px-6 py-3 text-xs">{m.deliveryCharge != null ? `${m.deliveryCharge} BDT` : '-'}</td>
                      <td className="px-6 py-3 text-xs">{m.codCharge != null ? `${m.codCharge} BDT` : '-'}</td>
                      <td className="px-6 py-3 text-xs">{m.adjustment != null ? `${m.adjustment} BDT` : '-'}</td>
                      <td className="px-6 py-3 text-xs font-medium text-green-700">{m.amount != null ? `${m.amount} BDT` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={manualPage<=1} onClick={()=>setManualPage(p=>Math.max(1,p-1))}>Prev</button>
              <div className="text-sm text-gray-600">Page {manualPage} of {manualTotalPages}</div>
              <button className="px-3 py-2 bg-gray-100 rounded disabled:opacity-50" disabled={manualPage>=manualTotalPages} onClick={()=>setManualPage(p=>Math.min(manualTotalPages,p+1))}>Next</button>
            </div>

            {manualModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add Manual Payment</h3>
                    <button onClick={()=> setManualModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <input type="date" value={manualDate} onChange={(e)=> setManualDate(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                      <input type="number" step="0.01" value={manualAmount} onChange={(e)=> setManualAmount(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Charge</label>
                      <input type="number" step="0.01" value={manualDeliveryCharge} onChange={(e)=> setManualDeliveryCharge(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">COD Charge</label>
                      <input type="number" step="0.01" value={manualCodCharge} onChange={(e)=> setManualCodCharge(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Adjustment</label>
                      <input type="number" step="0.01" value={manualAdjustment} onChange={(e)=> setManualAdjustment(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Statement No</label>
                      <input value={manualStatementNo} onChange={(e)=> setManualStatementNo(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                      <input value={manualNote} onChange={(e)=> setManualNote(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={()=> setManualModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded text-sm">Cancel</button>
                    <button onClick={async ()=> { await saveManualPayment(); setManualModalOpen(false); }} disabled={savingManual} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
                      {savingManual ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>
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
                      <p className="font-medium">#{selectedOrder.orderType === 'landing_page' ? `LP-${selectedOrder.orderId.toString().padStart(6, '0')}` : `ORD-${selectedOrder.orderId.toString().padStart(6, '0')}`}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Type:</span>
                      <p className="font-medium">{selectedOrder.orderType === 'landing_page' ? 'Landing Page Order' : 'Website Order'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Courier Status:</span>
                      <p className="font-medium">{selectedOrder.courierStatus}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedOrder.courierResponse?.orderDetails?.customerName || 'Unknown Customer'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Product:</span>
                      <p className="font-medium">{selectedOrder.courierResponse?.orderDetails?.productName || 'Unknown Product'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <p className="font-medium">{selectedOrder.courierResponse?.orderDetails?.address || 'No Address'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivery Area:</span>
                      <p className="font-medium">{selectedOrder.courierResponse?.orderDetails?.deliveryArea || 'Unknown Area'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Courier Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    {selectedOrder.courierResponse?.consignment?.consignment_id && (
                      <div>
                        <span className="text-gray-500">Consignment ID:</span>
                        <p className="font-medium">{selectedOrder.courierResponse.consignment.consignment_id}</p>
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
