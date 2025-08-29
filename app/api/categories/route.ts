import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        },
        products: {
          include: {
            inventory: true
          }
        }
      }
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      parentId: c.parentId,
      productsCount: (c as any)._count?.products || 0,
      totalStock: c.products.reduce((total, product) => total + (product.inventory?.quantity || 0), 0),
      products: c.products.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.inventory?.quantity || 0
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, imageUrl, parentId } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        imageUrl: imageUrl || null,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        parent: true,
        children: true,
        products: true
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, imageUrl, parentId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if slug already exists for other categories
    if (slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) }
        }
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        imageUrl: imageUrl || null,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        parent: true,
        children: true,
        products: true
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category (with cascade handling)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: true,
        children: true
      }
    });

    if (!categoryWithProducts) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (categoryWithProducts.products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Please remove products first.' },
        { status: 400 }
      );
    }

    // Delete category and its children
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
