"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const generalSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  currency: z.string().min(1, "Currency is required"),
  openaiApiKey: z.string().min(1, "OpenAI API key is required"),
});

type GeneralFormData = z.infer<typeof generalSchema>;

const generalTabs = ["General", "Shipping Settings", "Payment Method"];

export default function GeneralSettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [defaultShippingCost, setDefaultShippingCost] = useState(0);
  
  // Payment method states
  const [paymentMethods, setPaymentMethods] = useState({
    cashOnDelivery: false,
    bankTransfer: false,
    bankAccountDetails: "",
    mobileBankingEnabled: false,
    mobileBanking: {
      bkash: false,
      nagad: false,
      rocket: false
    },
    mobileBankingNumbers: "",
    // Provider-specific settings (extended)
    mobileBankingDetails: {
      bkash: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
      nagad: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
      rocket: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" }
    },
    // Online payment gateway (SSLCommerz)
    online: {
      ssl: { enabled: false, storeId: "", storePass: "", sandbox: true }
    }
  });

  // Toast notification state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error"
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      siteName: "Nexus Shop",
      language: "bn",
      currency: "BDT",
      openaiApiKey: "",
    }
  });

  // Load active tab from localStorage on component mount
  useEffect(() => {
    const savedActiveTab = localStorage.getItem('nexus-shop-active-tab');
    if (savedActiveTab && generalTabs.includes(savedActiveTab)) {
      setActiveTab(savedActiveTab);
    }
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexus-shop-active-tab', activeTab);
  }, [activeTab]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('nexus-shop-general-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        reset(parsed);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        // Set default values if parsing fails
        reset({
          siteName: "Nexus Shop",
          language: "bn",
          currency: "BDT",
          openaiApiKey: "",
        });
      }
    } else {
      // Set default values if no saved settings
      reset({
        siteName: "Nexus Shop",
        language: "bn",
        currency: "BDT",
        openaiApiKey: "",
      });
    }
  }, [reset]);

  // Load shipping and payment settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          
          // Set shipping settings with safe access
          if (data.shipping && data.shipping.freeDelivery) {
            setFreeDelivery(data.shipping.freeDelivery.enabled || false);
            setFreeDeliveryThreshold(data.shipping.freeDelivery.threshold || 0);
          }
          if (data.shipping) {
            setDefaultShippingCost(data.shipping.defaultShippingCost || 0);
            setShippingZones(data.shipping.zones || []);
          }
          
          // Set payment settings with safe access
          if (data.payment) {
            setPaymentMethods(prev => ({
              cashOnDelivery: data.payment.cod?.enabled ?? prev.cashOnDelivery,
              bankTransfer: data.payment.bankTransfer?.enabled ?? prev.bankTransfer,
              bankAccountDetails: data.payment.bankTransfer?.accountDetails ?? prev.bankAccountDetails,
              mobileBankingEnabled: data.payment.mobileBanking?.enabled ?? prev.mobileBankingEnabled,
              mobileBanking: {
                bkash: data.payment.mobileBanking?.bkash ?? prev.mobileBanking.bkash,
                nagad: data.payment.mobileBanking?.nagad ?? prev.mobileBanking.nagad,
                rocket: data.payment.mobileBanking?.rocket ?? prev.mobileBanking.rocket
              },
              mobileBankingNumbers: data.payment.mobileBanking?.numbers ?? prev.mobileBankingNumbers,
              mobileBankingDetails: {
                bkash: {
                  enabled: data.payment.mobileBankingDetails?.bkash?.enabled ?? (data.payment.mobileBanking?.bkash ?? false),
                  number: data.payment.mobileBankingDetails?.bkash?.number ?? "",
                  accountName: data.payment.mobileBankingDetails?.bkash?.accountName ?? "",
                  accountType: data.payment.mobileBankingDetails?.bkash?.accountType ?? "Personal",
                  qrUrl: data.payment.mobileBankingDetails?.bkash?.qrUrl ?? "",
                  instructions: data.payment.mobileBankingDetails?.bkash?.instructions ?? ""
                },
                nagad: {
                  enabled: data.payment.mobileBankingDetails?.nagad?.enabled ?? (data.payment.mobileBanking?.nagad ?? false),
                  number: data.payment.mobileBankingDetails?.nagad?.number ?? "",
                  accountName: data.payment.mobileBankingDetails?.nagad?.accountName ?? "",
                  accountType: data.payment.mobileBankingDetails?.nagad?.accountType ?? "Personal",
                  qrUrl: data.payment.mobileBankingDetails?.nagad?.qrUrl ?? "",
                  instructions: data.payment.mobileBankingDetails?.nagad?.instructions ?? ""
                },
                rocket: {
                  enabled: data.payment.mobileBankingDetails?.rocket?.enabled ?? (data.payment.mobileBanking?.rocket ?? false),
                  number: data.payment.mobileBankingDetails?.rocket?.number ?? "",
                  accountName: data.payment.mobileBankingDetails?.rocket?.accountName ?? "",
                  accountType: data.payment.mobileBankingDetails?.rocket?.accountType ?? "Personal",
                  qrUrl: data.payment.mobileBankingDetails?.rocket?.qrUrl ?? "",
                  instructions: data.payment.mobileBankingDetails?.rocket?.instructions ?? ""
                }
              },
              online: {
                ssl: {
                  enabled: data.payment.online?.ssl?.enabled ?? prev.online.ssl.enabled,
                  storeId: data.payment.online?.ssl?.storeId ?? prev.online.ssl.storeId,
                  storePass: data.payment.online?.ssl?.storePass ?? prev.online.ssl.storePass,
                  sandbox: data.payment.online?.ssl?.sandbox ?? prev.online.ssl.sandbox
                }
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Load shipping settings from localStorage on component mount
  useEffect(() => {
    const savedShippingSettings = localStorage.getItem('nexus-shop-shipping-settings');
    if (savedShippingSettings) {
      try {
        const parsed = JSON.parse(savedShippingSettings);
        setShippingZones(parsed.zones || []);
        setFreeDelivery(parsed.freeDelivery || false);
        setFreeDeliveryThreshold(parsed.freeDeliveryThreshold || 0);
        setDefaultShippingCost(parsed.defaultCost || 0);
      } catch (error) {
        console.error('Error parsing saved shipping settings:', error);
        // Set default values if parsing fails
        setShippingZones([
          { id: 1, name: "Dhaka City", districts: ["Dhaka City"], cost: 0, deliveryTime: "1-2 days" },
          { id: 2, name: "Outside Dhaka", districts: ["Outside Dhaka"], cost: 50, deliveryTime: "3-5 days" },
        ]);
        setFreeDelivery(false);
        setFreeDeliveryThreshold(0);
        setDefaultShippingCost(0);
      }
    } else {
      // Set default values if no saved settings
      setShippingZones([
        { id: 1, name: "Dhaka City", districts: ["Dhaka City"], cost: 0, deliveryTime: "1-2 days" },
        { id: 2, name: "Outside Dhaka", districts: ["Outside Dhaka"], cost: 50, deliveryTime: "3-5 days" },
      ]);
      setFreeDelivery(false);
      setFreeDeliveryThreshold(0);
      setDefaultShippingCost(0);
    }
  }, []);

  // Load payment settings from localStorage on component mount
  useEffect(() => {
    const savedPaymentSettings = localStorage.getItem('nexus-shop-payment-settings');
    if (savedPaymentSettings) {
      try {
        const parsed = JSON.parse(savedPaymentSettings);
        const defaults = {
          cashOnDelivery: false,
          bankTransfer: false,
          bankAccountDetails: "",
          mobileBankingEnabled: false,
          mobileBanking: { bkash: false, nagad: false, rocket: false },
          mobileBankingNumbers: "",
          mobileBankingDetails: {
            bkash: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
            nagad: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
            rocket: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" }
          },
          online: { ssl: { enabled: false, storeId: "", storePass: "", sandbox: true } }
        };
        const merged = {
          ...defaults,
          ...parsed,
          mobileBankingEnabled: parsed?.mobileBankingEnabled ?? defaults.mobileBankingEnabled,
          mobileBanking: { ...defaults.mobileBanking, ...(parsed?.mobileBanking || {}) },
          mobileBankingDetails: {
            bkash: { ...defaults.mobileBankingDetails.bkash, ...(parsed?.mobileBankingDetails?.bkash || {}) },
            nagad: { ...defaults.mobileBankingDetails.nagad, ...(parsed?.mobileBankingDetails?.nagad || {}) },
            rocket: { ...defaults.mobileBankingDetails.rocket, ...(parsed?.mobileBankingDetails?.rocket || {}) }
          },
          online: {
            ssl: {
              enabled: parsed?.online?.ssl?.enabled ?? defaults.online.ssl.enabled,
              storeId: parsed?.online?.ssl?.storeId ?? defaults.online.ssl.storeId,
              storePass: parsed?.online?.ssl?.storePass ?? defaults.online.ssl.storePass,
              sandbox: parsed?.online?.ssl?.sandbox ?? defaults.online.ssl.sandbox
            }
          }
        };
        setPaymentMethods(merged);
      } catch (error) {
        console.error('Error parsing saved payment settings:', error);
        // Set default values if parsing fails
        setPaymentMethods({
          cashOnDelivery: false,
          bankTransfer: false,
          bankAccountDetails: "",
          mobileBankingEnabled: false,
          mobileBanking: { bkash: false, nagad: false, rocket: false },
          mobileBankingNumbers: "",
          mobileBankingDetails: {
            bkash: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
            nagad: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
            rocket: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" }
          },
          online: { ssl: { enabled: false, storeId: "", storePass: "", sandbox: true } }
        });
      }
    } else {
      // Set default values if no saved settings
      setPaymentMethods({
        cashOnDelivery: false,
        bankTransfer: false,
        bankAccountDetails: "",
        mobileBankingEnabled: false,
        mobileBanking: { bkash: false, nagad: false, rocket: false },
        mobileBankingNumbers: "",
        mobileBankingDetails: {
          bkash: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
          nagad: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" },
          rocket: { enabled: false, number: "", accountName: "", accountType: "Personal", qrUrl: "", instructions: "" }
        },
        online: { ssl: { enabled: false, storeId: "", storePass: "", sandbox: true } }
      });
    }
  }, []);

  // Save settings to localStorage whenever form data changes
  useEffect(() => {
    const subscription = watch((value) => {
      if (value.siteName && value.language && value.currency) {
        localStorage.setItem('nexus-shop-general-settings', JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Show toast notification
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Helpers: QR upload and AI instruction generate
  const uploadQrImage = async (provider: 'bkash' | 'nagad' | 'rocket', file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url: string = Array.isArray(data.urls) ? data.urls[0] : (data.url || '');
      if (!url) throw new Error('No URL returned');
      setPaymentMethods(prev => ({
        ...prev,
        mobileBankingDetails: {
          ...prev.mobileBankingDetails,
          [provider]: { ...prev.mobileBankingDetails[provider], qrUrl: url }
        }
      }));
      showToast('QR image uploaded');
    } catch (e) {
      console.error(e);
      showToast('Failed to upload QR image', 'error');
    }
  };

  const generateQrImage = async (provider: 'bkash' | 'nagad' | 'rocket') => {
    try {
      const number = paymentMethods.mobileBankingDetails[provider].number?.trim();
      if (!number) {
        showToast('Enter account number first', 'error');
        return;
      }
      const res = await fetch(`/api/qr?provider=${provider}&number=${encodeURIComponent(number)}`);
      if (!res.ok) throw new Error('QR generate failed');
      const data = await res.json();
      const url: string = data.url || data.dataUrl;
      if (!url) throw new Error('No URL returned');
      setPaymentMethods(prev => ({
        ...prev,
        mobileBankingDetails: {
          ...prev.mobileBankingDetails,
          [provider]: { ...prev.mobileBankingDetails[provider], qrUrl: url }
        }
      }));
      showToast('QR generated');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate QR', 'error');
    }
  };

  const generateInstructions = async (provider: 'bkash' | 'nagad' | 'rocket') => {
    try {
      const number = paymentMethods.mobileBankingDetails[provider].number?.trim();
      if (!number) {
        showToast('Enter account number first', 'error');
        return;
      }
      // Try to read API key from saved general settings (localStorage)
      let apiKey = '';
      try {
        const saved = localStorage.getItem('nexus-shop-general-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          apiKey = parsed.openaiApiKey || '';
        }
      } catch {}
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment-instructions',
          provider,
          number,
          accountType: paymentMethods.mobileBankingDetails[provider].accountType,
          language: 'bn',
          apiKey: apiKey || undefined
        })
      });
      if (!res.ok) throw new Error('AI failed');
      const data = await res.json();
      const text: string = data.instructions || data.text || '';
      if (!text) throw new Error('No instructions returned');
      setPaymentMethods(prev => ({
        ...prev,
        mobileBankingDetails: {
          ...prev.mobileBankingDetails,
          [provider]: { ...prev.mobileBankingDetails[provider], instructions: text }
        }
      }));
      showToast('Instructions generated');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate instructions', 'error');
    }
  };

  const onSubmit = async (data: GeneralFormData) => {
    setIsLoading(true);
    setMessage("");

    try {
      // Save to localStorage
      localStorage.setItem('nexus-shop-general-settings', JSON.stringify(data));
      
      // Save global currency setting separately for system-wide use
      localStorage.setItem('nexus-shop-global-currency', data.currency);
      
      // Trigger currency change across the entire system
      // Notify all components about currency change
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency: data.currency } 
      }));
      
      // Update currency in localStorage for immediate effect
      localStorage.setItem('nexus-shop-currency', data.currency);
      
      // Also save to .env format for reference
      const envContent = `# Site Settings
SITE_NAME=${data.siteName}
SITE_DESCRIPTION=${data.siteDescription || ''}
LANGUAGE=${data.language}
CURRENCY=${data.currency}

# OpenAI Configuration
OPENAI_API_KEY=${data.openaiApiKey}

# Other settings...
APP_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
`;

      // Show success message
      setMessage(`Settings saved successfully! Currency updated to ${data.currency}. This will apply across the entire system.`);
      
      // Reset form with new data
      reset(data);
      
      // Reload page after a short delay to ensure all components pick up the new currency
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setMessage("Error saving settings. Please try again.");
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAI = async () => {
    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const apiKey = formData.get('openaiApiKey') as string;
    
    if (!apiKey) {
      alert("Please enter OpenAI API key first");
      return;
    }

    // Check if API key format is valid
    if (!apiKey.startsWith('sk-')) {
      alert("❌ Invalid OpenAI API key format. API key should start with 'sk-'");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Test Product",
          category: "Test Category",
          language: "bn",
          apiKey: apiKey
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.description) {
          alert(`✅ OpenAI API Test Successful!\n\nGenerated Description:\n${data.description}`);
        } else {
          alert(`❌ OpenAI API Test Failed!\n\nError: No description generated`);
        }
      } else {
        const errorData = await response.json();
        alert(`❌ OpenAI API Test Failed!\n\nError: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`❌ OpenAI API Test Failed!\n\nError: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">General Settings</h1>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-4">
            {generalTabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === "General" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Site Name</label>
                  <input 
                    {...register("siteName")}
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter site name"
                  />
                  {errors.siteName && (
                    <p className="text-xs text-red-600 mt-1">{errors.siteName.message}</p>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Language</label>
                  <select 
                    {...register("language")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                  {errors.language && (
                    <p className="text-xs text-red-600 mt-1">{errors.language.message}</p>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Currency</label>
                  <select 
                    {...register("currency")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  {errors.currency && (
                    <p className="text-xs text-red-600 mt-1">{errors.currency.message}</p>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-white md:col-span-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">OpenAI API Key</label>
                  <div className="flex gap-2">
                    <input 
                      {...register("openaiApiKey")}
                      type="password"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={testOpenAI}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Test API
                    </button>
                  </div>
                  {errors.openaiApiKey && (
                    <p className="text-xs text-red-600 mt-1">{errors.openaiApiKey.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Required for AI-powered content features
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>

              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{message}</p>
                </div>
              )}
            </form>
          )}

          {activeTab === "Shipping Settings" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Shipping Configuration</h3>
              <div className="space-y-5">
                {/* Compact Free Delivery + Default Cost */}
                <div className="border rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div className="flex items-center justify-between md:justify-start gap-3">
                      <label htmlFor="freeDelivery" className="text-sm font-medium text-gray-800">Enable Free Delivery</label>
                      <input
                        type="checkbox"
                        id="freeDelivery"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={freeDelivery}
                        onChange={(e) => setFreeDelivery(e.target.checked)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Free Threshold</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={freeDeliveryThreshold}
                          onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Cost</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={defaultShippingCost}
                          onChange={(e) => setDefaultShippingCost(parseFloat(e.target.value) || 0)}
                          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${freeDelivery ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                          placeholder="0"
                          disabled={isLoading || freeDelivery}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {freeDelivery
                      ? (freeDeliveryThreshold === 0 ? 'Free delivery for all orders.' : `Free delivery above ${freeDeliveryThreshold}.`)
                      : 'Default cost applies where zone not matched.'}
                  </p>
                </div>

                {/* Default Shipping Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Shipping Cost</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={defaultShippingCost}
                    onChange={(e) => setDefaultShippingCost(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      freeDelivery ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="0.00"
                    disabled={isLoading || freeDelivery}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {freeDelivery 
                      ? "Disabled when free delivery is enabled" 
                      : "This cost applies to areas not covered by specific zones"
                    }
                  </p>
                </div>

                {/* Shipping Zones */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Shipping Zones</label>
                    <button
                      type="button"
                                             onClick={() => {
                         const newZone = {
                           id: Date.now(),
                           name: "",
                           districts: [],
                           shippingCost: 0,
                           cost: 0,
                           deliveryTime: ""
                         };
                         setShippingZones([...shippingZones, newZone]);
                       }}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        freeDelivery 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      disabled={isLoading || freeDelivery}
                    >
                      + Add Zone
                    </button>
                  </div>
                  
                  {freeDelivery && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Free Delivery Mode:</strong> Shipping zones are disabled. All orders will get free delivery above the threshold amount.
                      </p>
                    </div>
                  )}
                  
                  <div className={`space-y-4 ${freeDelivery ? 'opacity-50 pointer-events-none' : ''}`}>
                    {shippingZones.map((zone, zoneIndex) => (
                      <div key={zone.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-900">Zone {zoneIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => {
                              setShippingZones(shippingZones.filter((_, index) => index !== zoneIndex));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                            disabled={isLoading}
                          >
                            Remove
                          </button>
                        </div>
                        
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Zone Name</label>
                             <input 
                               type="text"
                               value={zone.name}
                               onChange={(e) => {
                                 const updatedZones = [...shippingZones];
                                 updatedZones[zoneIndex].name = e.target.value;
                                 setShippingZones(updatedZones);
                               }}
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="e.g., Dhaka City, Outside Dhaka"
                               disabled={isLoading}
                             />
                           </div>
                           
                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Shipping Cost</label>
                             <input 
                               type="number"
                               min="0"
                               step="0.01"
                               value={zone.shippingCost || zone.cost || 0}
                               onChange={(e) => {
                                 const updatedZones = [...shippingZones];
                                 updatedZones[zoneIndex].shippingCost = parseFloat(e.target.value) || 0;
                                 updatedZones[zoneIndex].cost = parseFloat(e.target.value) || 0; // Keep both for compatibility
                                 setShippingZones(updatedZones);
                               }}
                               className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="0.00"
                               disabled={isLoading}
                             />
                           </div>
                         </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Shipping Area Name</label>
                          <p className="text-xs text-gray-500 mb-2">This name will appear in checkout form</p>
                          <input 
                            type="text"
                            value={zone.name}
                            onChange={(e) => {
                              const updatedZones = [...shippingZones];
                              updatedZones[zoneIndex].name = e.target.value;
                              setShippingZones(updatedZones);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., Dhaka City, Outside Dhaka, Chittagong Area"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Time</label>
                          <input 
                            type="text"
                            value={zone.deliveryTime}
                            onChange={(e) => {
                              const updatedZones = [...shippingZones];
                              updatedZones[zoneIndex].deliveryTime = e.target.value;
                              setShippingZones(updatedZones);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., 1-2 days, 3-5 days"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        
                        // Prepare shipping data
                        const shippingData = {
                          shipping: {
                            freeDelivery: {
                              enabled: freeDelivery,
                              threshold: freeDeliveryThreshold
                            },
                            defaultShippingCost,
                            zones: shippingZones
                          }
                        };
                        
                        console.log('Saving shipping data:', shippingData);
                        console.log('Shipping zones to save:', shippingZones);
                        
                        // Save to API
                        const response = await fetch('/api/settings', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(shippingData)
                        });
                        
                        if (response.ok) {
                          const savedData = await response.json();
                          console.log('API response:', savedData);
                          
                          // Save to localStorage as backup
                          const localData = {
                            freeDelivery: freeDelivery,
                            freeDeliveryThreshold: freeDeliveryThreshold,
                            defaultCost: defaultShippingCost,
                            zones: shippingZones
                          };
                          localStorage.setItem('nexus-shop-shipping-settings', JSON.stringify(localData));
                          console.log('Saved to localStorage:', localData);
                          
                          showToast("Shipping settings saved successfully!", "success");
                        } else {
                          throw new Error('Failed to save shipping settings');
                        }
                      } catch (error) {
                        showToast("Error saving shipping settings. Please try again.", "error");
                        console.error('Error saving shipping settings:', error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Shipping Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Payment Method" && (
            <div>
              <h3 className="text-lg font-medium mb-4">Payment Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COD card */}
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Customers pay at delivery</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={paymentMethods.cashOnDelivery}
                        onChange={(e)=>setPaymentMethods(prev=>({ ...prev, cashOnDelivery: e.target.checked }))}
                        disabled={isLoading}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                </div>

                {/* Bank transfer card */}
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-500">Manual transfer to your bank</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={paymentMethods.bankTransfer}
                        onChange={(e)=>setPaymentMethods(prev=>({ ...prev, bankTransfer: e.target.checked }))}
                        disabled={isLoading}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                  {paymentMethods.bankTransfer && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account Details</label>
                      <textarea
                        rows={2}
                        value={paymentMethods.bankAccountDetails}
                        onChange={(e)=>setPaymentMethods(prev=>({ ...prev, bankAccountDetails: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Account name, number, branch"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile banking card */}
                <div className="md:col-span-2 border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">Mobile Banking</p>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={paymentMethods.mobileBankingEnabled}
                        onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingEnabled: e.target.checked }))}
                        disabled={isLoading}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={()=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, enabled: !prev.mobileBankingDetails.bkash.enabled } }, mobileBanking: { ...prev.mobileBanking, bkash: !prev.mobileBankingDetails.bkash.enabled } }))}
                      className={`px-3 py-1 text-xs rounded-full border ${paymentMethods.mobileBankingDetails.bkash.enabled ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                      disabled={isLoading}
                    >bKash</button>
                    <button
                      type="button"
                      onClick={()=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, enabled: !prev.mobileBankingDetails.nagad.enabled } }, mobileBanking: { ...prev.mobileBanking, nagad: !prev.mobileBankingDetails.nagad.enabled } }))}
                      className={`px-3 py-1 text-xs rounded-full border ${paymentMethods.mobileBankingDetails.nagad.enabled ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                      disabled={isLoading}
                    >Nagad</button>
                    <button
                      type="button"
                      onClick={()=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, enabled: !prev.mobileBankingDetails.rocket.enabled } }, mobileBanking: { ...prev.mobileBanking, rocket: !prev.mobileBankingDetails.rocket.enabled } }))}
                      className={`px-3 py-1 text-xs rounded-full border ${paymentMethods.mobileBankingDetails.rocket.enabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                      disabled={isLoading}
                    >Rocket</button>
                  </div>
                  {/* Provider cards */}
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${paymentMethods.mobileBankingEnabled ? '' : 'opacity-60 pointer-events-none'}`}> 
                    {/* bKash */}
                    <div className={`border rounded-md p-3 ${paymentMethods.mobileBankingDetails.bkash.enabled ? '' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">bKash</span>
                        <label className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={paymentMethods.mobileBankingDetails.bkash.enabled} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, enabled: e.target.checked } }, mobileBanking: { ...prev.mobileBanking, bkash: e.target.checked } }))} disabled={isLoading} />
                          <div className="w-8 h-4 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                      <input value={paymentMethods.mobileBankingDetails.bkash.number} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, number: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="01XXXXXXXXX" />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                          <input value={paymentMethods.mobileBankingDetails.bkash.accountName} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, accountName: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="Shop Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select value={paymentMethods.mobileBankingDetails.bkash.accountType} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, accountType: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded">
                            <option>Personal</option>
                            <option>Merchant</option>
                          </select>
                        </div>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">QR Code</label>
                      {paymentMethods.mobileBankingDetails.bkash.qrUrl && (
                        <img src={paymentMethods.mobileBankingDetails.bkash.qrUrl} alt="bKash QR" className="w-24 h-24 object-contain mb-2 border rounded" />
                      )}
                      <div className="flex gap-2 mb-2">
                        <input value={paymentMethods.mobileBankingDetails.bkash.qrUrl} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, qrUrl: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="https://.../bkash-qr.png or data:image/png;base64,..." />
                        <button type="button" onClick={()=>generateQrImage('bkash')} className="px-2 py-1 text-xs bg-rose-600 text-white rounded">Generate</button>
                        <label className="px-2 py-1 text-xs bg-gray-700 text-white rounded cursor-pointer">
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadQrImage('bkash', f); }} />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">Customer Instructions</label>
                      <div className="flex gap-2">
                        <textarea rows={2} value={paymentMethods.mobileBankingDetails.bkash.instructions} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, bkash: { ...prev.mobileBankingDetails.bkash, instructions: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="Go to bKash app → Payment → Enter number → Amount → Reference..." />
                        <button type="button" onClick={()=>generateInstructions('bkash')} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded h-9 self-start">AI Generate</button>
                      </div>
                    </div>
                    {/* Nagad */}
                    <div className={`border rounded-md p-3 ${paymentMethods.mobileBankingDetails.nagad.enabled ? '' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Nagad</span>
                        <label className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={paymentMethods.mobileBankingDetails.nagad.enabled} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, enabled: e.target.checked } }, mobileBanking: { ...prev.mobileBanking, nagad: e.target.checked } }))} disabled={isLoading} />
                          <div className="w-8 h-4 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                      <input value={paymentMethods.mobileBankingDetails.nagad.number} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, number: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="01XXXXXXXXX" />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                          <input value={paymentMethods.mobileBankingDetails.nagad.accountName} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, accountName: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="Shop Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select value={paymentMethods.mobileBankingDetails.nagad.accountType} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, accountType: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded">
                            <option>Personal</option>
                            <option>Merchant</option>
                          </select>
                        </div>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">QR Code</label>
                      {paymentMethods.mobileBankingDetails.nagad.qrUrl && (
                        <img src={paymentMethods.mobileBankingDetails.nagad.qrUrl} alt="Nagad QR" className="w-24 h-24 object-contain mb-2 border rounded" />
                      )}
                      <div className="flex gap-2 mb-2">
                        <input value={paymentMethods.mobileBankingDetails.nagad.qrUrl} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, qrUrl: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="https://.../nagad-qr.png or data:image/png;base64,..." />
                        <button type="button" onClick={()=>generateQrImage('nagad')} className="px-2 py-1 text-xs bg-orange-600 text-white rounded">Generate</button>
                        <label className="px-2 py-1 text-xs bg-gray-700 text-white rounded cursor-pointer">
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadQrImage('nagad', f); }} />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">Customer Instructions</label>
                      <div className="flex gap-2">
                        <textarea rows={2} value={paymentMethods.mobileBankingDetails.nagad.instructions} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, nagad: { ...prev.mobileBankingDetails.nagad, instructions: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="Open Nagad → Payment → Enter number → Amount → Reference..." />
                        <button type="button" onClick={()=>generateInstructions('nagad')} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded h-9 self-start">AI Generate</button>
                      </div>
                    </div>
                    {/* Rocket */}
                    <div className={`border rounded-md p-3 ${paymentMethods.mobileBankingDetails.rocket.enabled ? '' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Rocket</span>
                        <label className="inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={paymentMethods.mobileBankingDetails.rocket.enabled} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, enabled: e.target.checked } }, mobileBanking: { ...prev.mobileBanking, rocket: e.target.checked } }))} disabled={isLoading} />
                          <div className="w-8 h-4 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                      <input value={paymentMethods.mobileBankingDetails.rocket.number} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, number: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="01XXXXXXXXX" />
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                          <input value={paymentMethods.mobileBankingDetails.rocket.accountName} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, accountName: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="Shop Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select value={paymentMethods.mobileBankingDetails.rocket.accountType} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, accountType: e.target.value } }}))} className="w-full px-2 py-1.5 text-sm border rounded">
                            <option>Personal</option>
                            <option>Merchant</option>
                          </select>
                        </div>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">QR Code</label>
                      {paymentMethods.mobileBankingDetails.rocket.qrUrl && (
                        <img src={paymentMethods.mobileBankingDetails.rocket.qrUrl} alt="Rocket QR" className="w-24 h-24 object-contain mb-2 border rounded" />
                      )}
                      <div className="flex gap-2 mb-2">
                        <input value={paymentMethods.mobileBankingDetails.rocket.qrUrl} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, qrUrl: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="https://.../rocket-qr.png or data:image/png;base64,..." />
                        <button type="button" onClick={()=>generateQrImage('rocket')} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Generate</button>
                        <label className="px-2 py-1 text-xs bg-gray-700 text-white rounded cursor-pointer">
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadQrImage('rocket', f); }} />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 mt-2">Customer Instructions</label>
                      <div className="flex gap-2">
                        <textarea rows={2} value={paymentMethods.mobileBankingDetails.rocket.instructions} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, mobileBankingDetails: { ...prev.mobileBankingDetails, rocket: { ...prev.mobileBankingDetails.rocket, instructions: e.target.value } }}))} className="flex-1 px-2 py-1.5 text-sm border rounded" placeholder="Rocket *322# → Payment → Enter number → Amount..." />
                        <button type="button" onClick={()=>generateInstructions('rocket')} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded h-9 self-start">AI Generate</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online Payment (SSLCommerz) */}
                <div className="md:col-span-2 border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">Online Payment (SSLCommerz)</p>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={paymentMethods.online.ssl.enabled}
                        onChange={(e)=>setPaymentMethods(prev=>({ ...prev, online: { ...prev.online, ssl: { ...prev.online.ssl, enabled: e.target.checked } } }))}
                        disabled={isLoading}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${paymentMethods.online.ssl.enabled ? '' : 'opacity-60 pointer-events-none'}`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Store ID</label>
                      <input value={paymentMethods.online.ssl.storeId} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, online: { ...prev.online, ssl: { ...prev.online.ssl, storeId: e.target.value } } }))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="ssl_xxxxx" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Store Password</label>
                      <input type="password" value={paymentMethods.online.ssl.storePass} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, online: { ...prev.online, ssl: { ...prev.online.ssl, storePass: e.target.value } } }))} className="w-full px-2 py-1.5 text-sm border rounded" placeholder="********" />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={paymentMethods.online.ssl.sandbox} onChange={(e)=>setPaymentMethods(prev=>({ ...prev, online: { ...prev.online, ssl: { ...prev.online.ssl, sandbox: e.target.checked } } }))} />
                        <span className="mr-2 text-xs text-gray-600">Sandbox</span>
                        <div className="w-10 h-5 bg-gray-200 rounded-full transition-colors relative peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="md:col-span-2 flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const paymentData = {
                          payment: {
                            cod: { enabled: paymentMethods.cashOnDelivery },
                            bankTransfer: { enabled: paymentMethods.bankTransfer, accountDetails: paymentMethods.bankAccountDetails },
                            mobileBanking: {
                              enabled: paymentMethods.mobileBankingEnabled,
                              bkash: paymentMethods.mobileBanking.bkash,
                              nagad: paymentMethods.mobileBanking.nagad,
                              rocket: paymentMethods.mobileBanking.rocket,
                              numbers: paymentMethods.mobileBankingNumbers
                            },
                            mobileBankingDetails: {
                              bkash: paymentMethods.mobileBankingDetails.bkash,
                              nagad: paymentMethods.mobileBankingDetails.nagad,
                              rocket: paymentMethods.mobileBankingDetails.rocket
                            },
                            online: { ssl: paymentMethods.online.ssl }
                          }
                        };
                        const response = await fetch('/api/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(paymentData)
                        });
                        if (response.ok) {
                          localStorage.setItem('nexus-shop-payment-settings', JSON.stringify(paymentMethods));
                          showToast("Payment settings saved successfully!", "success");
                        } else {
                          throw new Error('Failed to save payment settings');
                        }
                      } catch (error) {
                        showToast("Error saving payment settings. Please try again.", "error");
                        console.error('Error saving payment settings:', error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Payment Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smart Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
          <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <div className={`w-5 h-5 rounded-full mr-3 ${
              toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast({ show: false, message: "", type: "success" })}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
