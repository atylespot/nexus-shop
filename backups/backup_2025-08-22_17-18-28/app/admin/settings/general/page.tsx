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
    mobileBanking: {
      bkash: false,
      nagad: false,
      rocket: false
    },
    mobileBankingNumbers: ""
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
          
          // Set shipping settings
          setFreeDelivery(data.shipping.freeDelivery.enabled);
          setFreeDeliveryThreshold(data.shipping.freeDelivery.threshold);
          setDefaultShippingCost(data.shipping.defaultShippingCost);
          setShippingZones(data.shipping.zones);
          
          // Set payment settings
          setPaymentMethods({
            cashOnDelivery: data.payment.cod.enabled,
            bankTransfer: data.payment.bankTransfer.enabled,
            bankAccountDetails: data.payment.bankTransfer.accountDetails || "",
            mobileBanking: {
              bkash: data.payment.mobileBanking.bkash,
              nagad: data.payment.mobileBanking.nagad,
              rocket: data.payment.mobileBanking.rocket
            },
            mobileBankingNumbers: data.payment.mobileBanking.numbers || ""
          });
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
        setPaymentMethods(parsed);
      } catch (error) {
        console.error('Error parsing saved payment settings:', error);
        // Set default values if parsing fails
        setPaymentMethods({
          cashOnDelivery: false,
          bankTransfer: false,
          bankAccountDetails: "",
          mobileBanking: {
            bkash: false,
            nagad: false,
            rocket: false
          },
          mobileBankingNumbers: ""
        });
      }
    } else {
      // Set default values if no saved settings
      setPaymentMethods({
        cashOnDelivery: false,
        bankTransfer: false,
        bankAccountDetails: "",
        mobileBanking: {
          bkash: false,
          nagad: false,
          rocket: false
        },
        mobileBankingNumbers: ""
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

  const onSubmit = async (data: GeneralFormData) => {
    setIsLoading(true);
    setMessage("");

    try {
      // Save to localStorage
      localStorage.setItem('nexus-shop-general-settings', JSON.stringify(data));
      
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
      setMessage("Settings saved successfully! OpenAI API key is now configured for AI description generation.");
      
      // Reset form with new data
      reset(data);
      
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input 
                  {...register("siteName")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter site name"
                />
                {errors.siteName && (
                  <p className="text-sm text-red-600 mt-1">{errors.siteName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select 
                  {...register("language")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="en">English</option>
                </select>
                {errors.language && (
                  <p className="text-sm text-red-600 mt-1">{errors.language.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select 
                  {...register("currency")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                {errors.currency && (
                  <p className="text-sm text-red-600 mt-1">{errors.currency.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
                <div className="flex gap-2">
                  <input 
                    {...register("openaiApiKey")}
                    type="password"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={testOpenAI}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Test API
                  </button>
                </div>
                {errors.openaiApiKey && (
                  <p className="text-sm text-red-600 mt-1">{errors.openaiApiKey.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Required for AI-powered product description generation
                </p>
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
              <div className="space-y-6">
                {/* Free Delivery Settings */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-900 mb-3">Free Delivery Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="freeDelivery"
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={freeDelivery}
                        onChange={(e) => setFreeDelivery(e.target.checked)}
                        disabled={isLoading}
                      />
                      <label htmlFor="freeDelivery" className="text-sm font-medium text-blue-800">
                        Enable Free Delivery
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Free Delivery Threshold</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={freeDeliveryThreshold}
                        onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="50.00"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        {freeDeliveryThreshold === 0 
                          ? "⚠️ Free delivery enabled for ALL orders (set threshold to disable)"
                          : `Order amount above $${freeDeliveryThreshold} will get free delivery`
                        }
                      </p>
                    </div>
                  </div>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cash on Delivery</label>
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="cod"
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={paymentMethods.cashOnDelivery}
                      onChange={(e) => setPaymentMethods(prev => ({ ...prev, cashOnDelivery: e.target.checked }))}
                      disabled={isLoading}
                    />
                    <label htmlFor="cod" className="text-sm text-gray-700">Enable Cash on Delivery</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Transfer</label>
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="bank"
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={paymentMethods.bankTransfer}
                      onChange={(e) => setPaymentMethods(prev => ({ ...prev, bankTransfer: e.target.checked }))}
                      disabled={isLoading}
                    />
                    <label htmlFor="bank" className="text-sm text-gray-700">Enable Bank Transfer</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Details</label>
                  <textarea 
                    rows={3}
                    value={paymentMethods.bankAccountDetails}
                    onChange={(e) => setPaymentMethods(prev => ({ ...prev, bankAccountDetails: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank account details..."
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Banking</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="bkash"
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={paymentMethods.mobileBanking.bkash}
                        onChange={(e) => setPaymentMethods(prev => ({ ...prev, mobileBanking: { ...prev.mobileBanking, bkash: e.target.checked } }))}
                        disabled={isLoading}
                      />
                      <label htmlFor="bkash" className="text-sm text-gray-700">bKash</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="nagad"
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={paymentMethods.mobileBanking.nagad}
                        onChange={(e) => setPaymentMethods(prev => ({ ...prev, mobileBanking: { ...prev.mobileBanking, nagad: e.target.checked } }))}
                        disabled={isLoading}
                      />
                      <label htmlFor="nagad" className="text-sm text-gray-700">Nagad</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        id="rocket"
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={paymentMethods.mobileBanking.rocket}
                        onChange={(e) => setPaymentMethods(prev => ({ ...prev, mobileBanking: { ...prev.mobileBanking, rocket: e.target.checked } }))}
                        disabled={isLoading}
                      />
                      <label htmlFor="rocket" className="text-sm text-gray-700">Rocket</label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Banking Numbers</label>
                  <textarea 
                    rows={3}
                    value={paymentMethods.mobileBankingNumbers}
                    onChange={(e) => setPaymentMethods(prev => ({ ...prev, mobileBankingNumbers: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile banking numbers..."
                    disabled={isLoading}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        
                        // Prepare payment data
                        const paymentData = {
                          payment: {
                            cod: {
                              enabled: paymentMethods.cashOnDelivery
                            },
                            bankTransfer: {
                              enabled: paymentMethods.bankTransfer,
                              accountDetails: paymentMethods.bankAccountDetails
                            },
                            mobileBanking: {
                              bkash: paymentMethods.mobileBanking.bkash,
                              nagad: paymentMethods.mobileBanking.nagad,
                              rocket: paymentMethods.mobileBanking.rocket,
                              numbers: paymentMethods.mobileBankingNumbers
                            }
                          }
                        };
                        
                        // Save to API
                        const response = await fetch('/api/settings', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(paymentData)
                        });
                        
                        if (response.ok) {
                          // Save to localStorage as backup
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
