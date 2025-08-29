import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from '@/lib/performance';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET - Search products
export async function GET(request: NextRequest) {
  const timerId = performanceMonitor.startTimer('search_api');
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('Searching for products with query:', query);

    // Search products by name only for now (simpler query)
    console.log('Executing database query...');
    
    let products;
    try {
      // OPTIMIZED: Select only needed fields for better performance
      products = await prisma.product.findMany({
        where: {
          name: {
            contains: query
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          salePrice: true,
          currency: true,
          description: true,
          category: {
            select: {
              name: true
            }
          },
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
        },
        take: limit // Limit results based on parameter
      });
      
      console.log('Database query successful');
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    console.log(`Found ${products.length} products matching "${query}"`);

    // Format products data
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryName: product.category.name,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      currency: product.currency || 'BDT',
      images: product.images?.map(img => img.url) || [],
      description: product.description
    }));

    const duration = performanceMonitor.endTimer(timerId, 'search_api');
    console.log(`⚡ Search API took ${duration.toFixed(2)}ms`);

    return NextResponse.json({
      query: query,
      total: formattedProducts.length,
      products: formattedProducts
    });

  } catch (error) {
    console.error('Search error:', error);
    
    performanceMonitor.endTimer(timerId, 'search_api');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to search products',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
