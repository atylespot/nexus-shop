"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PhotoIcon, SparklesIcon, MagnifyingGlassIcon, FunnelIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

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

interface Product {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  buyPrice: number;
  regularPrice: number;
  salePrice?: number;
  currency: string;
  description: string;
  images: string[];
  slug: string;
  inventory?: {
    stock: number;
    lowStockThreshold: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const productsPerPage = 10;

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
      currency: "USD",
      description: "",
      initialStock: 0,
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      filterProducts();
    }
  }, [products, searchQuery, categoryFilter, stockFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter]);

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else {
          console.error('Invalid products data format:', productsData);
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch products:', productsResponse.status);
        setProducts([]);
      }
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('Invalid categories data format:', categoriesData);
          setCategories([]);
        }
      } else {
        console.error('Failed to fetch categories:', categoriesResponse.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.categoryId?.toString() === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => (product.inventory?.stock || 0) > 0);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(product => (product.inventory?.stock || 0) === 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(product => {
        const stock = product.inventory?.stock || 0;
        const threshold = product.inventory?.lowStockThreshold || 10;
        return stock > 0 && stock <= threshold;
      });
    }

    setFilteredProducts(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map(prod => prod.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      const deletePromises = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        if (product) {
          return fetch(`/api/products/${product.slug}`, { method: 'DELETE' });
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      setSelectedProducts([]);
      
      // Remove deleted products from both arrays
      setProducts(prev => prev.filter(prod => !selectedProducts.includes(prod.id)));
      setFilteredProducts(prev => prev.filter(prod => !selectedProducts.includes(prod.id)));
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting products:', error);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image.`);
          return;
        }
        
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
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Add image compression function
  const compressImage = (base64: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64);
      };
      img.src = base64;
    });
  };

  const generateAIDescription = async () => {
    if (!watch("name") || !watch("categoryId")) {
      alert("Please enter product name and select category first");
      return;
    }

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

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue("name", product.name);
      setValue("categoryId", String(product.categoryId));
      setValue("buyPrice", product.buyPrice);
      setValue("regularPrice", product.regularPrice);
      setValue("salePrice", product.salePrice || 0);
      setValue("currency", product.currency);
      setValue("description", product.description);
      setValue("initialStock", product.inventory?.stock || 0);
      setImagePreviews(product.images || []);
    } else {
      setEditingProduct(null);
      reset();
      setImagePreviews([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
    setImagePreviews([]);
  };

  const onSubmit = async (data: ProductFormData) => {
    const hasImages = imagePreviews.length > 0;
    
    if (!hasImages) {
      alert("Please add at least one product image");
      return;
    }

    console.log('🔍 Submitting product with data:', {
      name: data.name,
      categoryId: data.categoryId,
      imagesCount: imagePreviews.length,
      firstImagePreview: imagePreviews[0]?.substring(0, 100) + '...'
    });

    // Compress images before sending
    const compressedImages = await Promise.all(
      imagePreviews.map(img => compressImage(img, 800))
    );
    
    console.log('📸 Compressed images:', compressedImages.length);
    console.log('📸 First compressed image:', compressedImages[0]?.substring(0, 100) + '...');
    
    setIsLoading(true);
    try {
      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            images: compressedImages,
            buyPrice: data.buyPrice,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            initialStock: data.initialStock,
          })
        });

        if (response.ok) {
          const updatedProduct = await response.json();
          
          // Update the products array with the new data
          setProducts(prev => prev.map(prod => {
            if (prod.id === editingProduct.id) {
              return {
                ...prod,
                name: updatedProduct.name,
                categoryId: updatedProduct.categoryId,
                buyPrice: updatedProduct.buyPrice,
                regularPrice: updatedProduct.regularPrice,
                salePrice: updatedProduct.salePrice,
                currency: updatedProduct.currency,
                description: updatedProduct.description,
                images: updatedProduct.images || [],
                slug: updatedProduct.slug
              };
            }
            return prod;
          }));
          
          // Also update filteredProducts for immediate UI update
          setFilteredProducts(prev => prev.map(prod => {
            if (prod.id === editingProduct.id) {
              return {
                ...prod,
                name: updatedProduct.name,
                categoryId: updatedProduct.categoryId,
                buyPrice: updatedProduct.buyPrice,
                regularPrice: updatedProduct.regularPrice,
                salePrice: updatedProduct.salePrice,
                currency: updatedProduct.currency,
                description: updatedProduct.description,
                images: updatedProduct.images || [],
                slug: updatedProduct.slug
              };
            }
            return prod;
          }));
          
          alert("Product updated successfully!");
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            images: compressedImages,
            buyPrice: data.buyPrice,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
          })
        });

        if (response.ok) {
          const newProduct = await response.json();
          
          // Add the new product to both arrays
          const formattedNewProduct = {
            id: newProduct.id,
            name: newProduct.name,
            categoryId: newProduct.categoryId,
            categoryName: categories.find(c => c.id === String(newProduct.categoryId))?.name || '',
            buyPrice: newProduct.buyPrice,
            regularPrice: newProduct.regularPrice,
            salePrice: newProduct.salePrice,
            currency: newProduct.currency,
            description: newProduct.description,
            images: newProduct.images || [],
            slug: newProduct.slug,
            inventory: {
              stock: newProduct.initialStock || 0,
              lowStockThreshold: 10
            }
          };
          
          setProducts(prev => [...prev, formattedNewProduct]);
          setFilteredProducts(prev => [...prev, formattedNewProduct]);
          
          alert("Product created successfully!");
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      }
      
      closeModal();
    } catch (error) {
      alert("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (product: any) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/products/${product.slug}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Remove from both arrays
          setProducts(prev => prev.filter(prod => prod.id !== product.id));
          setFilteredProducts(prev => prev.filter(prod => prod.id !== product.id));
          alert('Product deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(`Failed to delete product: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const getModalTitle = () => {
    return editingProduct ? "Edit Product" : "Create Product";
  };

  const getSubmitButtonText = () => {
    return editingProduct ? "Update" : "Create";
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          + Create Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="low-stock">Low Stock</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {filteredProducts.length} products found
            </span>
            {selectedProducts.length > 0 && (
              <span className="text-sm text-emerald-600 font-medium">
                {selectedProducts.length} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-emerald-800 font-medium">
              {selectedProducts.length} products selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRODUCT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRICES
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STOCK
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.filter(product => product && product.id).map((product) => {
                console.log('Product:', product.name, 'Images:', product.images, 'First image:', product.images?.[0]);
                return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-3 border border-gray-200"
                          src={product.images[0]}
                          alt={product.name}
                          onError={(e) => {
                            console.log('Image failed to load:', product.images[0]);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', product.images[0]);
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.slug}</div>
                        <div className="text-xs text-gray-400">
                          {product.images && Array.isArray(product.images) ? `${product.images.length} image(s)` : 'No images'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.categoryName || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="text-xs">
                        Buy: {formatPrice(product.buyPrice, product.currency)}
                      </div>
                      <div className="font-medium">
                        {formatPrice(product.regularPrice, product.currency)}
                      </div>
                      {product.salePrice && (
                        <div className="text-green-600 font-medium">
                          Sale: {formatPrice(product.salePrice, product.currency)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {product.inventory?.stock || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        in stock
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      ACTIVE
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(product)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            <div className="mt-6">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
              >
                + Create Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{getModalTitle()}</h3>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="BDT">BDT (৳)</option>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                              onError={(e) => {
                                console.log('Preview image failed to load:', preview);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={(e) => {
                                console.log('Preview image loaded successfully:', preview);
                              }}
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
                        <p className="text-xs text-gray-500 mt-1">Max file size: 5MB, Supported: JPG, PNG, GIF</p>
                      </div>
                    )}
                    <input
                      id="modal-product-images-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('modal-product-images-upload')?.click()}
                      className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                    >
                      + Add Images
                    </button>
                  </div>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : getSubmitButtonText()}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {selectedProducts.length} selected product{selectedProducts.length === 1 ? '' : 's'}? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
