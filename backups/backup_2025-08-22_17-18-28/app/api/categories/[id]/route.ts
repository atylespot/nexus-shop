import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update specific category by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, slug, imageUrl, parentId } = body;

    console.log('🔄 Updating category:', { id, name, slug, imageUrl, parentId });

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if slug already exists for other categories
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) }
        }
      });

      if (slugExists) {
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
        name: name || existingCategory.name,
        slug: slug || existingCategory.slug,
        imageUrl: imageUrl !== undefined ? imageUrl : existingCategory.imageUrl,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : existingCategory.parentId
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    console.log('✅ Category updated successfully:', updatedCategory);

    const formatted = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      imageUrl: updatedCategory.imageUrl,
      parentId: updatedCategory.parentId,
      productsCount: (updatedCategory as any)._count?.products || 0,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('❌ Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific category by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🗑️ Deleting category:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists and has products
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

    if (categoryWithProducts.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please remove subcategories first.' },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    console.log('✅ Category deleted successfully');

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

// GET - Get specific category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { products: true }
        },
        parent: true,
        children: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const formatted = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      productsCount: (category as any)._count?.products || 0,
      parent: category.parent,
      children: category.children
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
