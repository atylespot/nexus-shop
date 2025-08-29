import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { safeCache } from '@/lib/cache';
import { performanceMonitor } from '@/lib/performance';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET - Fetch products by category slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const timerId = performanceMonitor.startTimer('category_api');
  
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

      console.log('Fetching products for category slug:', slug);

      // Check cache first for better performance
      const cacheKey = `category:${slug}:products`;
      const cached = await safeCache.get(cacheKey);
      
      if (cached) {
        console.log('Serving from cache for:', slug);
        return NextResponse.json(cached);
      }
      
      // Find category by slug
      console.log('Searching for category with slug:', slug);
      
      const category = await prisma.category.findUnique({
        where: { slug }
      });
      
      console.log('Database query result:', category ? 'Category found' : 'Category not found');
      
      if (!category) {
        console.log('Category not found for slug:', slug);
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      // Now fetch products separately for this category
      console.log('Fetching products for category ID:', category.id);
      
      let products;
      try {
        // OPTIMIZED: Select only needed fields for better performance
        products = await prisma.product.findMany({
          where: { categoryId: category.id },
          select: {
            id: true,
            name: true,
            slug: true,
            regularPrice: true,
            salePrice: true,
            currency: true,
            description: true,
            inventory: {
              select: {
                quantity: true,
                lowStockThreshold: true
              }
            },
            images: {
              select: {
                url: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
        
        console.log('Products found:', products.length);
        console.log('Products query successful');
        
        if (products.length === 0) {
          console.log('No products found for this category');
        }
        
      } catch (dbError) {
        console.error('Database query error:', dbError);
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        throw new Error(`Database query failed: ${errorMessage}`);
      }

      console.log('Category found:', category.name);

      // Format products data
      console.log('Raw products array length:', products.length);
      console.log('First product sample:', products[0]);
      
      const formattedProducts = products.map((product, index) => {
        console.log(`Processing product ${index + 1}:`, product.name);
        
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryName: category.name,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          currency: product.currency || 'BDT',
          images: product.images?.map(img => img.url) || [],
          description: product.description
        };
      });
      
      console.log('Formatted products count:', formattedProducts.length);

      const response = {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          imageUrl: category.imageUrl
        },
        products: formattedProducts
      };

      console.log('Sending response with', formattedProducts.length, 'products');
      
          // Cache the response for 5 minutes
    await safeCache.set(cacheKey, response, 300);
    
    const duration = performanceMonitor.endTimer(timerId, 'category_api');
    console.log(`⚡ Category API took ${duration.toFixed(2)}ms`);
    
    return NextResponse.json(response);

    } catch (error) {
    console.error('Error fetching category products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorName = error instanceof Error ? error.name : 'Unknown error type';
    
    performanceMonitor.endTimer(timerId, 'category_api');
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch category products',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
