"use client";
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  userEmail: string;
  phone: string;
  address: string;
  district: string;
  status: string;
  paymentStatus: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  currency: string;
  consignmentId?: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface PDFPreviewProps {
  orders: Order[];
  onClose: () => void;
  onGenerate: (settings: PDFSettings) => void;
}

interface PDFSettings {
  companyName: string;
  companyNameSize: number;
  consignmentIdSize: number;
  customerNameSize: number;
  phoneSize: number;
  addressSize: number;
  productSize: number;
  codSize: number;
  dateTimeSize: number;
  margin: number;
  cellPadding: number;
  cardsPerRow: number; // New: customizable cards per row
  cardsPerPage: number; // New: customizable cards per page
}

export default function PDFPreview({ orders, onClose, onGenerate }: PDFPreviewProps) {
  const [settings, setSettings] = useState<PDFSettings>({
    companyName: 'NEXUS SHOP',
    companyNameSize: 12,
    consignmentIdSize: 16,
    customerNameSize: 10,
    phoneSize: 9,
    addressSize: 9,
    productSize: 8,
    codSize: 10,
    dateTimeSize: 8,
    margin: 5,
    cellPadding: 5,
    cardsPerRow: 4, // Default to 4
    cardsPerPage: 16 // Default to 16
  });

  const [showSettings, setShowSettings] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pdfSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Validate and merge settings with defaults
        const validatedSettings = {
          companyName: parsedSettings.companyName || 'NEXUS SHOP',
          companyNameSize: parsedSettings.companyNameSize || 12,
          consignmentIdSize: parsedSettings.consignmentIdSize || 16,
          customerNameSize: parsedSettings.customerNameSize || 10,
          phoneSize: parsedSettings.phoneSize || 9,
          addressSize: parsedSettings.addressSize || 9,
          productSize: parsedSettings.productSize || 8,
          codSize: parsedSettings.codSize || 10,
          dateTimeSize: parsedSettings.dateTimeSize || 8,
          margin: parsedSettings.margin || 5,
          cellPadding: parsedSettings.cellPadding || 5,
          cardsPerRow: parsedSettings.cardsPerRow || 4, // Default to 4
          cardsPerPage: parsedSettings.cardsPerPage || 16 // Default to 16
        };
        setSettings(validatedSettings);
      } catch (error) {
        console.error('Error loading saved settings:', error);
        // Use default settings if loading fails
        setSettings({
          companyName: 'NEXUS SHOP',
          companyNameSize: 12,
          consignmentIdSize: 16,
          customerNameSize: 10,
          phoneSize: 9,
          addressSize: 9,
          productSize: 8,
          codSize: 10,
          dateTimeSize: 8,
          margin: 5,
          cellPadding: 5,
          cardsPerRow: 4, // Default to 4
          cardsPerPage: 16 // Default to 16
        });
      }
    }
  }, []);

  const handleSettingChange = (key: keyof PDFSettings, value: number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      // Validate settings before saving
      const validatedSettings = {
        companyName: settings.companyName || 'NEXUS SHOP',
        companyNameSize: Math.max(8, Math.min(20, settings.companyNameSize || 12)),
        consignmentIdSize: Math.max(12, Math.min(24, settings.consignmentIdSize || 16)),
        customerNameSize: Math.max(8, Math.min(16, settings.customerNameSize || 10)),
        phoneSize: Math.max(7, Math.min(14, settings.phoneSize || 9)),
        addressSize: Math.max(7, Math.min(14, settings.addressSize || 9)),
        productSize: Math.max(6, Math.min(12, settings.productSize || 8)),
        codSize: Math.max(8, Math.min(16, settings.codSize || 10)),
        dateTimeSize: Math.max(6, Math.min(12, settings.dateTimeSize || 8)),
        margin: Math.max(2, Math.min(15, settings.margin || 5)),
        cellPadding: Math.max(2, Math.min(10, settings.cellPadding || 5)),
        cardsPerRow: Math.max(2, Math.min(6, settings.cardsPerRow || 4)), // Default to 4
        cardsPerPage: Math.max(1, Math.min(20, settings.cardsPerPage || 16)) // Default to 16
      };
      
      localStorage.setItem('pdfSettings', JSON.stringify(validatedSettings));
      setSettings(validatedSettings); // Update local state with validated values
      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('Failed to save settings');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  // Download PDF directly
  const downloadPDF = () => {
    onGenerate(settings);
  };

  // Calculate grid dimensions (dynamic grid)
  const gridCols = settings.cardsPerRow;
  const gridRows = Math.ceil(settings.cardsPerPage / settings.cardsPerRow);
  const ordersPerPage = Math.min(settings.cardsPerPage, gridCols * gridRows);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">PDF Preview & Settings</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
            >
              📥 Quick Download PDF
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              {showSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">PDF Settings</h3>
              
              {/* Save Message */}
              {savedMessage && (
                <div className={`mb-4 p-2 rounded text-sm text-center ${
                  savedMessage.includes('successfully') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {savedMessage}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name Size: {settings.companyNameSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={settings.companyNameSize}
                    onChange={(e) => handleSettingChange('companyNameSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consignment ID Size: {settings.consignmentIdSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.consignmentIdSize}
                    onChange={(e) => handleSettingChange('consignmentIdSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name Size: {settings.customerNameSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={settings.customerNameSize}
                    onChange={(e) => handleSettingChange('customerNameSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Size: {settings.phoneSize}px
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="14"
                    value={settings.phoneSize}
                    onChange={(e) => handleSettingChange('phoneSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Size: {settings.addressSize}px
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="14"
                    value={settings.addressSize}
                    onChange={(e) => handleSettingChange('addressSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Size: {settings.productSize}px
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="12"
                    value={settings.productSize}
                    onChange={(e) => handleSettingChange('productSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    COD Size: {settings.codSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={settings.codSize}
                    onChange={(e) => handleSettingChange('codSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Time Size: {settings.dateTimeSize}px
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="12"
                    value={settings.dateTimeSize}
                    onChange={(e) => handleSettingChange('dateTimeSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margin: {settings.margin}mm
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={settings.margin}
                    onChange={(e) => handleSettingChange('margin', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cell Padding: {settings.cellPadding}px
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={settings.cellPadding}
                    onChange={(e) => handleSettingChange('cellPadding', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cards Per Row: {settings.cardsPerRow}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={settings.cardsPerRow}
                    onChange={(e) => handleSettingChange('cardsPerRow', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cards Per Page: {settings.cardsPerPage}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={settings.cardsPerPage}
                    onChange={(e) => handleSettingChange('cardsPerPage', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={saveSettings}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  💾 Save Settings
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  📥 Download PDF
                </button>
              </div>
            </div>
          )}

                     {/* Preview Area */}
           <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
             <div className="mb-4">
               <h3 className="text-lg font-semibold mb-2">
                 PDF Preview ({orders.length} orders, {totalPages} pages)
               </h3>
               <p className="text-sm text-gray-600 mb-4">
                 This shows how your PDF will look. Adjust settings on the left to customize the layout.
               </p>
               
               {/* Quick Actions */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                 <h4 className="text-sm font-semibold text-blue-800 mb-2">Quick Actions:</h4>
                 <div className="flex gap-3">
                   <button
                     onClick={saveSettings}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                   >
                     💾 Save Current Settings
                   </button>
                   <button
                     onClick={downloadPDF}
                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                   >
                     📥 Download PDF Now
                   </button>
                 </div>
                 
                 {/* Preset Layouts */}
                 <div className="mt-4 pt-4 border-t border-blue-200">
                   <h5 className="text-sm font-semibold text-blue-800 mb-2">Quick Layouts:</h5>
                   <div className="grid grid-cols-2 gap-2">
                     <button
                       onClick={() => {
                         setSettings(prev => ({ ...prev, cardsPerRow: 1, cardsPerPage: 1 }));
                       }}
                       className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                     >
                       1 Card (Full Page)
                     </button>
                     <button
                       onClick={() => {
                         setSettings(prev => ({ ...prev, cardsPerRow: 2, cardsPerPage: 4 }));
                       }}
                       className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                     >
                       2x2 Layout
                     </button>
                     <button
                       onClick={() => {
                         setSettings(prev => ({ ...prev, cardsPerRow: 3, cardsPerPage: 9 }));
                       }}
                       className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                     >
                       3x3 Layout
                     </button>
                     <button
                       onClick={() => {
                         setSettings(prev => ({ ...prev, cardsPerRow: 4, cardsPerPage: 16 }));
                       }}
                       className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                     >
                       4x4 Layout
                     </button>
                   </div>
                 </div>
                 
                 <p className="text-xs text-blue-600 mt-2">
                   💡 Tip: Use "Show Settings" to customize layout, then save and download!
                 </p>
               </div>
             </div>

                                      {/* A4 Page Preview */}
             <div className="bg-white border-2 border-gray-300 mx-auto" style={{ width: '210mm', height: '297mm', transform: 'scale(0.6)', transformOrigin: 'top left' }}>
               {/* Dynamic Grid Layout with Gap */}
               <div 
                 className="h-full gap-1"
                 style={{ 
                   display: 'grid',
                   gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                   gridTemplateRows: `repeat(${gridRows}, 1fr)`
                 }}
               >
                 {Array.from({ length: Math.min(ordersPerPage, orders.length) }).map((_, index) => {
                  const order = orders[index];
                  if (!order) return <div key={index} className="border border-gray-200 bg-gray-50"></div>;

                  return (
                    <div key={index} className="border border-gray-300 p-2 relative">
                      {/* Company Name */}
                      <div 
                        className="font-bold text-center mb-1"
                        style={{ fontSize: `${settings.companyNameSize}px` }}
                      >
                        {settings.companyName}
                      </div>

                      {/* Consignment ID */}
                      <div 
                        className="font-bold text-center mb-2"
                        style={{ fontSize: `${settings.consignmentIdSize}px` }}
                      >
                        {order.consignmentId || 'N/A'}
                      </div>

                      {/* Customer Info */}
                      <div style={{ fontSize: `${settings.customerNameSize}px` }}>
                        <div className="mb-1">Customer: {order.customerName || 'N/A'}</div>
                      </div>

                      <div style={{ fontSize: `${settings.phoneSize}px` }}>
                        <div className="mb-1">Phone: {order.phone || 'N/A'}</div>
                      </div>

                      <div style={{ fontSize: `${settings.addressSize}px` }}>
                        <div className="mb-2">Address: {(order.address || 'N/A').substring(0, 20)}...</div>
                      </div>

                                             {/* Product Info */}
                       <div className="flex items-center mb-2">
                         {order.items[0]?.productImage ? (
                           <div className="relative">
                             <img 
                               src={order.items[0].productImage} 
                               alt="Product" 
                               className="w-4 h-4 object-cover border border-gray-300 mr-2"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
                               }}
                             />
                             <div className="absolute -bottom-1 left-0 right-0 text-[6px] text-gray-500 text-center">
                               Has Image
                             </div>
                           </div>
                         ) : null}
                         <div 
                           className={`w-4 h-4 bg-gray-200 border border-gray-300 mr-2 flex items-center justify-center text-xs text-gray-500 relative ${
                             order.items[0]?.productImage ? 'hidden' : ''
                           }`}
                         >
                           {order.items[0]?.productImage ? 'IMG' : (order.items[0]?.productName || 'N/A').charAt(0).toUpperCase()}
                           <div className="absolute -bottom-1 left-0 right-0 text-[6px] text-gray-500 text-center">
                             {order.items[0]?.productImage ? 'Has Image' : 'No Image'}
                           </div>
                         </div>
                         <div style={{ fontSize: `${settings.productSize}px` }}>
                           {(order.items[0]?.productName || 'N/A').substring(0, 15)}...
                         </div>
                       </div>

                      {/* COD */}
                      <div 
                        className="font-bold text-red-600 text-center"
                        style={{ fontSize: `${settings.codSize}px` }}
                      >
                        COD: {order.total || 0} BDT
                      </div>

                      {/* Date Time */}
                      <div 
                        className="text-center absolute bottom-1 left-1 right-1"
                        style={{ fontSize: `${settings.dateTimeSize}px` }}
                      >
                        {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Note: This is a preview. The actual PDF will be generated with your selected settings.</p>
              <p>Scale: 0.6x (actual PDF will be full A4 size)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
