"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, SparklesIcon } from "@heroicons/react/24/outline";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().min(1, "Category is required"),
  buyPrice: z.string().min(1, "Buy price is required").transform((val) => parseFloat(val) || 0),
  regularPrice: z.string().min(1, "Regular price is required").transform((val) => parseFloat(val) || 0),
  salePrice: z.string().optional().transform((val) => val ? parseFloat(val) || 0 : undefined),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().min(1, "Description is required"),
  initialStock: z.string().min(1, "Initial stock is required").transform((val) => parseInt(val) || 0),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      buyPrice: 0,
      regularPrice: 0,
      salePrice: 0,
      currency: "BDT",
      description: "",
      initialStock: 0,
    }
  });

  // Load categories from API and prefill currency from general settings
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
    try {
      const saved = localStorage.getItem('nexus-shop-general-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.currency) {
          setValue('currency', parsed.currency);
        }
      }
    } catch {}
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files]);
      
      // Create preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          setImagePreviews(prev => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const generateAIDescription = async () => {
    if (!watch("name") || !watch("categoryId")) {
      alert("Please enter product name and select category first");
      return;
    }

    // Get API key from localStorage
    const savedSettings = localStorage.getItem('nexus-shop-general-settings');
    let apiKey = '';
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        apiKey = parsed.openaiApiKey;
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }

    if (!apiKey) {
      alert("Please configure OpenAI API key in Settings → General first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const category = categories.find(c => c.id === watch("categoryId"));
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: watch("name"),
          category: category?.name,
          language: "bn",
          apiKey: apiKey
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.description) {
          setValue("description", data.description);
        } else {
          alert("Failed to generate AI description");
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to generate AI description: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert("Error generating AI description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const onSubmit = async (data: ProductFormData) => {
    // Check if we have images (either from previews or selected files)
    const hasImages = imagePreviews.length > 0;
    
    if (!hasImages) {
      alert("Please add at least one product image");
      return;
    }

    // Use image previews (base64 strings) for storage
    const allImages = [...imagePreviews];
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: allImages,
          buyPrice: data.buyPrice,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
        })
      });

      if (response.ok) {
        alert("Product created successfully!");
        closeModal();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Create Product</h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Product
        </button>
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Product</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      {...register("categoryId")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buy Price *
                    </label>
                    <input
                      {...register("buyPrice")}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    {errors.buyPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.buyPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Price *
                    </label>
                    <input
                      {...register("regularPrice")}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    {errors.regularPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.regularPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price
                    </label>
                    <input
                      {...register("salePrice")}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      {...register("currency")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Stock *
                    </label>
                    <input
                      {...register("initialStock")}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.initialStock && (
                      <p className="mt-1 text-sm text-red-600">{errors.initialStock.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={generateAIDescription}
                      disabled={isGeneratingDescription || !watch("name") || !watch("categoryId")}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {isGeneratingDescription ? "Generating..." : "🤖 AI Generate"}
                    </button>
                  </div>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Product description..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Images *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-600">Upload product images</p>
                      </div>
                    )}
                    <input
                      id="product-images-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('product-images-upload')?.click()}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      + Add Images
                    </button>
                  </div>
                  {/* Only show error if no images */}
                  {imagePreviews.length === 0 && (
                    <p className="text-sm text-red-600">At least one image is required</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create Products</h3>
        <p className="text-gray-600 mb-6">
          Click the "Create Product" button above to add new products to your store.
        </p>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          + Create Product
        </button>
      </div>
    </div>
  );
}
