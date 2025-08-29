'use client';

import { useMemo, useState, useEffect } from 'react';
import OrderForm from './OrderForm';

type Pair = { color: string; size: string };

interface Props {
  landing: any;
  productImageSrc?: string | null;
  allowedVariations: Pair[];
}

export default function CheckoutWithVariants({ landing, productImageSrc, allowedVariations }: Props) {
  const colors = useMemo(() => Array.from(new Set((allowedVariations || []).map(p => p.color).filter(Boolean))), [allowedVariations]);
  const [selectedColor, setSelectedColor] = useState('');
  const sizeOptions = useMemo(
    () => selectedColor ? Array.from(new Set((allowedVariations || []).filter(p => p.color === selectedColor).map(p => p.size).filter(Boolean))) : [],
    [allowedVariations, selectedColor]
  );
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (!selectedColor && colors.length === 1) setSelectedColor(colors[0]);
  }, [colors, selectedColor]);

  useEffect(() => {
    if (selectedColor && !selectedSize && sizeOptions.length === 1) setSelectedSize(sizeOptions[0]);
  }, [selectedColor, sizeOptions, selectedSize]);

  // Expose selection for OrderForm (to fire AddToCart with correct attributes)
  useEffect(() => {
    try {
      (window as any).__landingSelection = { color: selectedColor, size: selectedSize };
    } catch {}
  }, [selectedColor, selectedSize]);

  // Derive a color->image map from landing.product.variations if available
  const colorToImage: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    try {
      const vars: any[] = (landing?.product as any)?.variations || [];
      for (const v of vars) {
        const name = v?.color?.name || '';
        const img = v?.imageUrl || '';
        if (name && img && !map[name]) map[name] = img;
      }
    } catch {}
    return map;
  }, [landing]);

  const getColorImage = (c: string) => colorToImage[c] || (productImageSrc || undefined);

  return (
    <div className="space-y-4">
      {/* পুনঃনির্বাচন সেকশন */}
      {colors.length > 0 && (
        <div className="py-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-3">পুনঃনির্বাচন করুন</h3>
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-2">Color</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setSelectedColor(c); setSelectedSize(''); }}
                    className={`border rounded-lg overflow-hidden text-left hover:shadow ${selectedColor===c?'border-emerald-500 ring-2 ring-emerald-300':''}`}
                  >
                    <div className="w-full h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {getColorImage(c) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getColorImage(c)} alt={c} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-xs text-gray-500">{c}</div>
                      )}
                    </div>
                    <div className="px-3 py-2 text-sm">{c || 'N/A'}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedColor && (
              <div>
                <div className="text-sm text-gray-600 mb-2">Size</div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1 border rounded ${selectedSize===s?'bg-emerald-600 text-white border-emerald-600':'bg-white hover:bg-gray-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                  {sizeOptions.length===0 && (
                    <span className="text-xs text-gray-500">এই কালারে কোনো সাইজ নেই</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order form with externally selected variation */}
      <OrderForm
        landing={landing}
        productImageSrc={productImageSrc}
        allowedVariations={allowedVariations}
        preselectedColor={selectedColor}
        preselectedSize={selectedSize}
      />
    </div>
  );
}


