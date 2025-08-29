"use client";
import { useState, useEffect } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useSearchParams, useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import PDFPreview from "../../../components/PDFPreview";
import CustomerTrackingModal from "../../../components/CustomerTrackingModal";

interface Order {
  id: string;
  orderNo?: string;
  customerName: string;
  userEmail?: string;
  phone: string;
  address: string;
  district?: string;
  status: "pending" | "processing" | "in-courier" | "delivered" | "cancelled" | "refunded";
  paymentStatus?: string;
  shippingCost?: number;
  subtotal?: number;
  total?: number;
  currency?: string;
  consignmentId?: string;
  createdAt?: string;
  orderDate?: string;
  items?: OrderItem[];
  selected?: boolean;
  productName?: string;
  productPrice?: number;
  deliveryCharge?: number;
  totalAmount?: number;
  deliveryArea?: string;
  paymentMethod?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  // New state for date range filter
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  
  // New state for bulk status update
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState({
    isOpen: false,
    newStatus: 'pending' as Order['status']
  });
  
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    district: '',
    status: '' as Order['status'],
    items: [] as any[],
    shippingCost: 0,
    subtotal: 0,
    total: 0
  });

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean; customerPhone: string }>({
    isOpen: false,
    customerPhone: ''
  });

  // Get status from URL parameter (sidebar menu)
  const statusFilter = searchParams.get('status') || 'all';

  // Filter orders based on sidebar status, search query, and date range
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const searchMatch = 
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.includes(searchQuery) ||
      order.consignmentId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    let dateMatch = true;
    if (dateRange.fromDate) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(dateRange.fromDate);
      dateMatch = dateMatch && orderDate >= fromDate;
    }
    if (dateRange.toDate) {
      const orderDate = new Date(order.createdAt);
      const toDate = new Date(dateRange.toDate);
      // Set to end of day for inclusive comparison
      toDate.setHours(23, 59, 59, 999);
      dateMatch = dateMatch && orderDate <= toDate;
    }
    
    return statusMatch && searchMatch && dateMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, dateRange.fromDate, dateRange.toDate]);

  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      'in-courier': orders.filter(o => o.status === 'in-courier').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      refunded: orders.filter(o => o.status === 'refunded').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all orders
  const selectAllOrders = () => {
    setSelectedOrders(filteredOrders.map(order => order.id));
  };

  // Deselect all orders
  const deselectAllOrders = () => {
    setSelectedOrders([]);
  };

  // Show PDF Preview
  const handleShowPDFPreview = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for PDF generation');
      return;
    }
    setShowPDFPreview(true);
  };

  // Bulk Status Update
  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for status update');
      return;
    }

    if (!confirm(`Are you sure you want to update ${selectedOrders.length} order(s) status to "${bulkStatusUpdate.newStatus}"?`)) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const promises = selectedOrders.map(orderId => 
        fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: bulkStatusUpdate.newStatus,
            previousStatus: orders.find(o => o.id === orderId)?.status || 'pending'
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(res => res.json()));

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
          // Update local state
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrders[index] 
                ? { ...order, status: bulkStatusUpdate.newStatus }
                : order
            )
          );
        } else {
          errorCount++;
          console.error(`Failed to update order ${selectedOrders[index]}:`, result.error);
        }
      });

      alert(`Bulk status update completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`);
      
      // Clear selection and close modal
      setSelectedOrders([]);
      setBulkStatusUpdate({ isOpen: false, newStatus: 'pending' });
      
      // Reload orders to refresh data
      loadOrders();
      
    } catch (error) {
      console.error('Error in bulk status update:', error);
      alert('Failed to process bulk status update. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Bulk Export to CSV
  const handleBulkExportCSV = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for export');
      return;
    }

    try {
      const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
      
      // Create CSV content
      const headers = [
        'Order No',
        'Customer Name',
        'Phone',
        'Email',
        'Address',
        'District',
        'Status',
        'Payment Status',
        'Subtotal',
        'Shipping Cost',
        'Total',
        'Consignment ID',
        'Created Date',
        'Items'
      ];

      const csvContent = [
        headers.join(','),
        ...selectedOrdersData.map(order => [
          `"${order.orderNo}"`,
          `"${order.customerName || ''}"`,
          `"${order.phone || ''}"`,
          `"${order.userEmail || ''}"`,
          `"${order.address || ''}"`,
          `"${order.district || ''}"`,
          `"${order.status}"`,
          `"${order.paymentStatus || ''}"`,
          order.subtotal,
          order.shippingCost,
          order.total,
          `"${order.consignmentId || ''}"`,
          `"${new Date(order.createdAt).toLocaleDateString()}"`,
          `"${order.items.map(item => `${item.productName} (${item.quantity}x${item.price})`).join('; ')}"`
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nexus-shop-orders-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`CSV exported successfully with ${selectedOrdersData.length} orders!`);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Bulk Export to Excel (using CSV format for simplicity)
  const handleBulkExportExcel = () => {
    // For now, we'll use CSV format which Excel can open
    // In a real implementation, you might want to use a library like xlsx
    handleBulkExportCSV();
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for deletion');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedOrders.map(orderId => 
        fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(res => res.json()));

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
          // Remove order from local state
          setOrders(prevOrders => prevOrders.filter(order => order.id !== selectedOrders[index]));
        } else {
          errorCount++;
          console.error(`Failed to delete order ${selectedOrders[index]}:`, result.error);
        }
      });

      alert(`Bulk delete completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`);
      
      // Clear selection
      setSelectedOrders([]);
      
      // Reload orders to refresh data
      loadOrders();
      
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Failed to process bulk delete. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateRange({ fromDate: '', toDate: '' });
  };

  // Generate PDF with custom settings
  const generatePDFWithSettings = async (settings: any) => {
    try {
      // Get selected orders data
      const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = settings.margin;
      const contentWidth = pageWidth - (2 * margin);
      
      // Calculate grid dimensions (dynamic grid)
      const gridCols = settings.cardsPerRow || 4;
      const gridRows = Math.ceil((settings.cardsPerPage || 16) / gridCols);
      const ordersPerPage = Math.min(settings.cardsPerPage || 16, gridCols * gridRows);
      const totalPages = Math.ceil(selectedOrdersData.length / ordersPerPage);
      
      let currentOrderIndex = 0;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate grid cell dimensions with gap
        const gap = 2; // 2mm gap between cards
        const cellWidth = (contentWidth - (gap * (gridCols - 1))) / gridCols;
        const cellHeight = (pageHeight - (gap * (gridRows - 1))) / gridRows;
        
        // Draw grid for orders
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            if (currentOrderIndex < selectedOrdersData.length) {
              const order = selectedOrdersData[currentOrderIndex];
              const x = margin + (col * (cellWidth + gap));
              const y = (row * (cellHeight + gap));
              
              // Draw cell border
              pdf.setDrawColor(0, 0, 0);
              pdf.setLineWidth(0.5);
              pdf.rect(x, y, cellWidth, cellHeight);
              
              // Company name at top (centered)
              pdf.setFontSize(settings.companyNameSize);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text(settings.companyName, x + (cellWidth / 2), y + 8, { align: 'center' });
              
              // Consignment ID (bigger size, centered)
              pdf.setFontSize(settings.consignmentIdSize);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text(order.consignmentId || 'N/A', x + (cellWidth / 2), y + 18, { align: 'center' });
              
              // Customer Name
              pdf.setFontSize(settings.customerNameSize);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Customer: ${order.customerName || 'N/A'}`, x + settings.cellPadding, y + 28);
              
              // Customer Phone Number
              pdf.setFontSize(settings.phoneSize);
              pdf.setTextColor(0, 0, 0);
              pdf.text(`Phone: ${order.phone || 'N/A'}`, x + settings.cellPadding, y + 35);
              
              // Address (truncated if too long)
              const address = order.address || 'N/A';
              const truncatedAddress = address.length > 20 ? address.substring(0, 20) + '...' : address;
              pdf.text(`Address: ${truncatedAddress}`, x + settings.cellPadding, y + 42);
              
              // Product Image and Name in one line
              const productName = order.items[0]?.productName || 'N/A';
              const truncatedProduct = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;
              
              // Product Image (real image if available, otherwise placeholder)
              if (order.items[0]?.productImage) {
                try {
                  // Try to add real product image
                  pdf.addImage(order.items[0].productImage, 'JPEG', x + settings.cellPadding, y + 50, 15, 15);
                } catch (error) {
                  // Fallback to placeholder if image fails
                  pdf.setDrawColor(200, 200, 200);
                  pdf.setFillColor(240, 240, 240);
                  pdf.rect(x + settings.cellPadding, y + 50, 15, 15, 'FD');
                  pdf.setFontSize(6);
                  pdf.setTextColor(100, 100, 100);
                  pdf.text('IMG', x + settings.cellPadding + 3, y + 58, { align: 'center' });
                }
              } else {
                // No image available - show product name first letter
                pdf.setDrawColor(200, 200, 200);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(x + settings.cellPadding, y + 50, 15, 15, 'FD');
                pdf.setFontSize(6);
                pdf.setTextColor(100, 100, 100);
                pdf.text(productName.charAt(0).toUpperCase(), x + settings.cellPadding + 3, y + 58, { align: 'center' });
              }
              
              // Add small text below image to indicate image status
              pdf.setFontSize(4);
              pdf.setTextColor(80, 80, 80);
              const imageStatus = order.items[0]?.productImage ? 'Has Image' : 'No Image';
              pdf.text(imageStatus, x + settings.cellPadding + 1, y + 65, { align: 'center' });
              
              // Product Name (right side of image)
              pdf.setFontSize(settings.productSize);
              pdf.setTextColor(0, 0, 0);
              pdf.text(truncatedProduct, x + settings.cellPadding + 20, y + 58);
              
              // COD Amount (Total amount, centered)
              pdf.setFontSize(settings.codSize);
              pdf.setTextColor(255, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`COD: ${order.total || 0} BDT`, x + (cellWidth / 2), y + 70, { align: 'center' });
              
              // Date and Time at bottom (centered)
              const currentDate = new Date().toLocaleDateString();
              const currentTime = new Date().toLocaleTimeString();
              pdf.setFontSize(settings.dateTimeSize);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`${currentDate} ${currentTime}`, x + (cellWidth / 2), y + 78, { align: 'center' });
              
              currentOrderIndex++;
            }
          }
        }
      }
      
      // Download PDF
      pdf.save(`nexus-shop-orders-${new Date().toISOString().split('T')[0]}.pdf`);
      
      alert(`PDF generated successfully with ${selectedOrdersData.length} orders!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Generate PDF for selected orders (legacy function)
  const generatePDF = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for PDF generation');
      return;
    }

    try {
      // Get selected orders data
      const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 5; // Reduced margin for more space
      const contentWidth = pageWidth - (2 * margin);
      
      // Calculate grid dimensions (dynamic grid)
      const gridCols = 4; // Legacy function keeps 4x4 for backward compatibility
      const gridRows = 4;
      const ordersPerPage = gridCols * gridRows;
      const totalPages = Math.ceil(selectedOrdersData.length / ordersPerPage);
      
      let currentOrderIndex = 0;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate grid cell dimensions with gap
        const gap = 2; // 2mm gap between cards
        const cellWidth = (contentWidth - (gap * (gridCols - 1))) / gridCols;
        const cellHeight = (pageHeight - (gap * (gridRows - 1))) / gridRows;
        
        // Draw grid for orders
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            if (currentOrderIndex < selectedOrdersData.length) {
              const order = selectedOrdersData[currentOrderIndex];
              const x = margin + (col * (cellWidth + gap));
              const y = (row * (cellHeight + gap));
              
              // Draw cell border
              pdf.setDrawColor(0, 0, 0);
              pdf.setLineWidth(0.5);
              pdf.rect(x, y, cellWidth, cellHeight);
              
              // Company name at top
              pdf.setFontSize(12);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text('NEXUS SHOP', x + 5, y + 8, { align: 'center' });
              
              // Consignment ID (bigger size, no "Consignment ID:" text)
              pdf.setFontSize(16);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text(order.consignmentId || 'N/A', x + 5, y + 18);
              
              // Customer Name
              pdf.setFontSize(10);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Customer: ${order.customerName || 'N/A'}`, x + 5, y + 28);
              
              // Customer Phone Number
              pdf.setFontSize(9);
              pdf.setTextColor(0, 0, 0);
              pdf.text(`Phone: ${order.phone || 'N/A'}`, x + 5, y + 35);
              
              // Address (truncated if too long)
              const address = order.address || 'N/A';
              const truncatedAddress = address.length > 20 ? address.substring(0, 20) + '...' : address;
              pdf.text(`Address: ${truncatedAddress}`, x + 5, y + 42);
              
              // Product Image and Name in one line
              const productName = order.items[0]?.productName || 'N/A';
              const truncatedProduct = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;
              
              // Product Image (real image if available, otherwise placeholder)
              if (order.items[0]?.productImage) {
                try {
                  // Try to add real product image
                  pdf.addImage(order.items[0].productImage, 'JPEG', x + 5, y + 50, 15, 15);
                } catch (error) {
                  // Fallback to placeholder if image fails
                  pdf.setDrawColor(200, 200, 200);
                  pdf.setFillColor(240, 240, 240);
                  pdf.rect(x + 5, y + 50, 15, 15, 'FD');
                  pdf.setFontSize(6);
                  pdf.setTextColor(100, 100, 100);
                  pdf.text('IMG', x + 7, y + 58, { align: 'center' });
                }
              } else {
                // No image available - show product name first letter
                pdf.setDrawColor(200, 200, 200);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(x + 5, y + 50, 15, 15, 'FD');
                pdf.setFontSize(6);
                pdf.setTextColor(100, 100, 100);
                pdf.text(productName.charAt(0).toUpperCase(), x + 7, y + 58, { align: 'center' });
              }
              
              // Add small text below image to indicate image status
              pdf.setFontSize(4);
              pdf.setTextColor(80, 80, 80);
              const imageStatus = order.items[0]?.productImage ? 'Has Image' : 'No Image';
              pdf.text(imageStatus, x + 5, y + 65, { align: 'center' });
              
              // Product Name (right side of image)
              pdf.setFontSize(8);
              pdf.setTextColor(0, 0, 0);
              pdf.text(truncatedProduct, x + 25, y + 58);
              
              // COD Amount (Total amount)
              pdf.setFontSize(10);
              pdf.setTextColor(255, 0, 0);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`COD: ${order.total || 0} BDT`, x + 5, y + 70);
              
              // Date and Time at bottom
              const currentDate = new Date().toLocaleDateString();
              const currentTime = new Date().toLocaleTimeString();
              pdf.setFontSize(8);
              pdf.setTextColor(0, 0, 0);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`${currentDate} ${currentTime}`, x + 5, y + 78);
              
              currentOrderIndex++;
            }
          }
        }
      }
      
      // Download PDF
      pdf.save(`nexus-shop-orders-${new Date().toISOString().split('T')[0]}.pdf`);
      
      alert(`PDF generated successfully with ${selectedOrdersData.length} orders!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Bulk courier booking
  const bulkCourierBooking = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order for courier booking');
      return;
    }

    try {
      const promises = selectedOrders.map(orderId => 
        fetch('/api/courier/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            note: 'Bulk courier booking from order management',
            deliveryType: 0
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(res => res.json()));

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.data) {
          successCount++;
          console.log(`✅ Order ${selectedOrders[index]} booked successfully`);
        } else {
          errorCount++;
          console.error(`❌ Failed to book order ${selectedOrders[index]}:`, result.error);
        }
      });

      alert(`Bulk courier booking completed!\n✅ Success: ${successCount}\n❌ Failed: ${errorCount}`);
      
      // Clear selection and reload orders
      setSelectedOrders([]);
      loadOrders();
      
      // Redirect to courier orders page
      router.push('/admin/courier');
    } catch (error) {
      console.error('Error in bulk courier booking:', error);
      alert('Failed to process bulk courier booking. Please try again.');
    }
  };

  // Update status counts in sidebar when orders change
  useEffect(() => {
    const updateSidebarCounts = async () => {
      try {
        // Update the sidebar counts by triggering a custom event
        const event = new CustomEvent('updateOrderCounts', {
          detail: { counts: statusCounts }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating sidebar counts:', error);
      }
    };

    if (orders.length > 0) {
      updateSidebarCounts();
    }
  }, [orders, statusCounts]);

  // Debug selectedOrder
  useEffect(() => {
    if (selectedOrder) {
      console.log('🔍 Selected Order Debug:', {
        id: selectedOrder.id,
        address: selectedOrder.address,
        district: selectedOrder.district,
        fullOrder: selectedOrder
      });
      console.log('🔍 Full Order Object:', JSON.stringify(selectedOrder, null, 2));
    }
  }, [selectedOrder]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], previousStatus: Order['status']) => {
    setIsUpdatingStatus(true);
    try {
      // If status is changing to 'in-courier', automatically create courier order
      if (newStatus === 'in-courier' && previousStatus !== 'in-courier') {
        try {
          console.log('🚚 Automatically creating courier order for status change to in-courier');
          const courierResponse = await fetch('/api/courier/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              note: 'Order automatically sent to courier via status change',
              deliveryType: 0 // Home delivery
            }),
          });

          if (courierResponse.ok) {
            const courierData = await courierResponse.json();
            console.log('✅ Courier order created automatically:', courierData);
            
            // Show success message
            alert(`Courier order created automatically! Consignment ID: ${courierData.data.courierResponse.consignment.consignment_id}`);
          } else {
            const errorData = await courierResponse.json();
            console.error('Failed to create courier order automatically:', errorData.error);
            alert(`Failed to create courier order: ${errorData.error}. Please try again.`);
            // Revert the status change since courier order failed
            return;
          }
        } catch (courierError) {
          console.error('Error creating courier order automatically:', courierError);
          alert('Failed to create courier order automatically. Please try again.');
          // Revert the status change since courier order failed
          return;
        }
      }

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          previousStatus: previousStatus
        })
      });

      if (response.ok) {
        // Update local state immediately
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Update sidebar counts in real-time
        const event = new CustomEvent('orderStatusChanged', {
          detail: { orderId, newStatus, previousStatus }
        });
        window.dispatchEvent(event);
        
        // If status changed to 'in-courier', redirect to courier orders page
        if (newStatus === 'in-courier') {
          // Refresh orders to get updated consignment ID
          setTimeout(() => loadOrders(), 2000);
          router.push('/admin/courier');
        } else {
          // Redirect to the new status filter URL if we're on a specific status page
          const currentStatus = searchParams.get('status');
          if (currentStatus && currentStatus !== 'all') {
            const newStatusParam = newStatus === 'pending' ? 'pending' :
                                    newStatus === 'processing' ? 'processing' :
                                    newStatus === 'in-courier' ? 'in-courier' :
                                    newStatus === 'delivered' ? 'delivered' :
                                    newStatus === 'cancelled' ? 'cancelled' :
                                    newStatus === 'refunded' ? 'refunded' : 'all';
            router.push(`/admin/orders?status=${newStatusParam}`);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update order status:', errorData.error);
        alert(`Failed to update order status: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Function to delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove order from local state
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        alert('Order deleted successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete order: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle edit mode
  const toggleEditMode = (order: Order) => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Initialize edit form data
      setEditFormData({
        customerName: order.customerName || '',
        phone: order.phone || '',
        address: order.address || '',
        district: order.district || '',
        status: order.status,
        items: order.items.map(item => ({
          id: item.id, // Include existing item ID
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        })),
        shippingCost: order.shippingCost || 0,
        subtotal: order.subtotal,
        total: order.total
      });
    }
  };

  // Function to update order
  const updateOrder = async () => {
    if (!selectedOrder) return;

    setIsLoading(true);
    try {
      // Calculate new totals
      const newSubtotal = editFormData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const newTotal = newSubtotal + editFormData.shippingCost;

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          subtotal: newSubtotal,
          total: newTotal
        }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === selectedOrder.id ? updatedOrder : order
          )
        );
        
        // Update selected order
        setSelectedOrder(updatedOrder);
        
        // Exit edit mode
        setIsEditMode(false);
        
        // Dispatch events for real-time updates
        if (updatedOrder.status !== selectedOrder.status) {
          // Status changed, dispatch order status change event
          window.dispatchEvent(new CustomEvent('orderStatusChanged', {
            detail: {
              orderId: selectedOrder.id,
              newStatus: updatedOrder.status,
              previousStatus: selectedOrder.status
            }
          }));
        }
        
        alert('Order updated successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to update order: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  // Load orders from API on component mount
  useEffect(() => {
    loadOrders();
    
    // Set up interval to refresh orders every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);





  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Orders data received:', data);
        // Check if data.orders exists and is an array
        const rawOrders = data.orders && Array.isArray(data.orders) ? data.orders : [];
        
        // Transform API data to UI format
        const transformedOrders = rawOrders.map((order: any) => ({
          id: order.id.toString(),
          orderNo: `ORD-${order.id.toString().padStart(6, '0')}`,
          customerName: order.customerName || '',
          userEmail: order.userEmail || '',
          phone: order.customerPhone || order.phone || '',
          address: order.customerAddress || order.address || '',
          district: order.district || '',
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          shippingCost: order.deliveryCharge || 0,
          subtotal: order.productPrice || 0,
          total: order.totalAmount || 0,
          currency: order.currency || 'BDT',
          consignmentId: order.consignmentId || '',
          createdAt: order.orderDate || order.createdAt || new Date().toISOString(),
          orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
          items: order.items || [{
            id: order.id.toString(),
            productId: order.productId?.toString() || '',
            productName: order.productName || '',
            productImage: order.product?.images?.[0]?.url || '',
            quantity: 1,
            price: order.productPrice || 0
          }],
          productName: order.productName || '',
          productPrice: order.productPrice || 0,
          deliveryCharge: order.deliveryCharge || 0,
          totalAmount: order.totalAmount || 0,
          deliveryArea: order.deliveryArea || '',
          paymentMethod: order.paymentMethod || 'cash_on_delivery'
        }));
        
        console.log('🔄 Transformed orders:', transformedOrders);
        setOrders(transformedOrders);
      } else {
        console.error('Failed to load orders:', response.status);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Search, Date Filter and Bulk Actions */}
      <div className="mb-6 space-y-4">
        {/* Search and Date Filter Row */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, Phone, Email, or Courier ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {(dateRange.fromDate || dateRange.toDate) && (
                <button
                  onClick={clearDateFilters}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
              <span className="font-medium text-purple-800">{selectedOrders.length} order(s) selected</span>
              <button
                onClick={deselectAllOrders}
                className="text-purple-600 hover:text-purple-800 underline text-sm"
              >
                Clear Selection
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllOrders}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              Select All
            </button>
            {selectedOrders.length > 0 && (
              <>
                {/* Bulk Status Update */}
                <button
                  onClick={() => setBulkStatusUpdate({ isOpen: true, newStatus: 'pending' })}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  🔄 Bulk Status Update ({selectedOrders.length})
                </button>
                
                {/* Bulk Export */}
                <div className="relative group">
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium">
                    📊 Export ({selectedOrders.length})
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={handleBulkExportCSV}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-t-lg"
                    >
                      📄 Export to CSV
                    </button>
                    <button
                      onClick={handleBulkExportExcel}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-b-lg"
                    >
                      📊 Export to Excel
                    </button>
                  </div>
                </div>
                
                {/* Bulk Delete */}
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                >
                  🗑️ Bulk Delete ({selectedOrders.length})
                </button>
                
                <button
                  onClick={handleShowPDFPreview}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  📄 Preview PDF ({selectedOrders.length})
                </button>
                <button
                  onClick={bulkCourierBooking}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                >
                  🚚 Bulk Courier Booking ({selectedOrders.length})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">No orders available.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-600 to-teal-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase w-16">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={() => selectedOrders.length === filteredOrders.length ? deselectAllOrders() : selectAllOrders()}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    {selectedOrders.length > 0 && (
                      <span className="ml-2 text-xs text-purple-200">
                        ({selectedOrders.length})
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase w-32">ORDER NO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">PRODUCT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">CUSTOMER</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">TOTAL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">CONSIGNMENT ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${
                  selectedOrders.includes(order.id) ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="max-w-[120px] truncate block" title={order.orderNo}>
                      {order.orderNo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        {order.items[0]?.productImage ? (
                          <img
                            src={order.items[0].productImage}
                            alt={order.items[0].productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">IMG</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.items[0]?.productName}</p>
                        <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.total} BDT
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'], order.status)}
                      disabled={isUpdatingStatus}
                      className={`px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'in-courier' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        order.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="in-courier">In Courier</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.status === 'in-courier' && order.consignmentId ? (
                      <span className="text-purple-600 font-medium font-mono bg-purple-50 px-2 py-1 rounded">
                        {order.consignmentId}
                      </span>
                    ) : order.status === 'in-courier' ? (
                      <span className="text-orange-500">Processing...</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>

                    <button
                      onClick={() => setTrackingModal({ isOpen: true, customerPhone: order.phone || '' })}
                      className="text-green-600 hover:text-green-900 ml-2"
                      title="Track Customer Performance"
                    >
                      Track
                    </button>

                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-600 hover:text-red-900 ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
                      </table>
            
            {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                  {selectedOrders.length > 0 && (
                    <span className="ml-3 text-purple-600 font-medium">
                      • {selectedOrders.length} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                      // Show first page, last page, current page, and pages around current page
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNum === currentPage
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-600 bg-white border border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
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
                      <p className="font-medium">{selectedOrder.orderNo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      {isEditMode ? (
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as Order['status'] }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="in-courier">In Courier</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      ) : (
                        <p className="font-medium">{selectedOrder.status}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <p className="font-medium">{selectedOrder.paymentStatus}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editFormData.customerName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium">{selectedOrder.phone}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Address:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium">{selectedOrder.address}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Shipping Area:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editFormData.district}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, district: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium">{selectedOrder.district}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Order Items</h4>
                  <div className="mt-2 space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                        <img
                          src={item.productImage || '/placeholder-product.jpg'}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{item.productName}</h5>
                          {isEditMode ? (
                            <div className="mt-2 grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-gray-500">Quantity:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editFormData.items[index]?.quantity || item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...editFormData.items];
                                    newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 1 };
                                    setEditFormData(prev => ({ ...prev, items: newItems }));
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Price per item:</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editFormData.items[index]?.price || item.price}
                                  onChange={(e) => {
                                    const newItems = [...editFormData.items];
                                    newItems[index] = { ...newItems[index], price: parseFloat(e.target.value) || 0 };
                                    setEditFormData(prev => ({ ...prev, items: newItems }));
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              <p>Qty: {item.quantity}</p>
                              <p>{item.price} BDT each</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {isEditMode 
                              ? `${(editFormData.items[index]?.quantity || item.quantity) * (editFormData.items[index]?.price || item.price)} BDT`
                              : `${item.quantity * item.price} BDT`
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Courier Information</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {selectedOrder.status === 'in-courier' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> Order sent to courier
                        </p>
                        <p className="text-sm text-gray-500">
                          Use the Courier Orders page to manage courier status updates
                        </p>
                      </div>
                    ) : selectedOrder.status === 'processing' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Change status to "In Courier" to automatically send to courier</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No courier information available</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Order Summary</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal:</span>
                      {isEditMode ? (
                        <span className="font-medium">
                          {editFormData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)} BDT
                        </span>
                      ) : (
                        <span className="font-medium">{selectedOrder.subtotal} BDT</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping:</span>
                      {isEditMode ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editFormData.shippingCost}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        />
                      ) : (
                        <span className="font-medium">{selectedOrder.shippingCost} BDT</span>
                      )}
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-lg text-gray-900">
                        {isEditMode 
                          ? `${editFormData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) + editFormData.shippingCost} BDT`
                          : `${selectedOrder.total} BDT`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={() => setIsEditMode(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateOrder}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {isLoading ? 'Updating...' : 'Update Order'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleEditMode(selectedOrder)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        Edit Order
                      </button>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreview
          orders={orders.filter(order => selectedOrders.includes(order.id))}
          onClose={() => setShowPDFPreview(false)}
          onGenerate={generatePDFWithSettings}
        />
      )}

      {/* Customer Tracking Modal */}
      <CustomerTrackingModal
        isOpen={trackingModal.isOpen}
        onClose={() => setTrackingModal({ isOpen: false, customerPhone: '' })}
        customerPhone={trackingModal.customerPhone}
      />

      {/* Bulk Status Update Modal */}
      {bulkStatusUpdate.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Status Update</h3>
                <button
                  onClick={() => setBulkStatusUpdate({ isOpen: false, newStatus: 'pending' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status for {selectedOrders.length} selected order(s):
                  </label>
                  <select
                    value={bulkStatusUpdate.newStatus}
                    onChange={(e) => setBulkStatusUpdate(prev => ({ ...prev, newStatus: e.target.value as Order['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="in-courier">In Courier</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setBulkStatusUpdate({ isOpen: false, newStatus: 'pending' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
