import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, roleId, status, userId, password, phone, avatarUrl } = body || {};
    if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 });

    // Generate unique userId
    let finalUserId = userId;
    if (!finalUserId) {
      const baseUserId = slugify(name);
      let userIdCounter = 1;
      let testUserId = baseUserId;
      
      // Check if userId already exists and generate unique one
      while (true) {
        const existingUser = await db.appUser.findUnique({ where: { userId: testUserId } });
        if (!existingUser) {
          finalUserId = testUserId;
          break;
        }
        testUserId = `${baseUserId}-${userIdCounter}`;
        userIdCounter++;
        
        // Prevent infinite loop
        if (userIdCounter > 100) {
          finalUserId = `${baseUserId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          break;
        }
      }
    }
    
    console.log('🆔 Generated userId:', finalUserId);
    
    // Double-check that userId is truly unique
    const finalCheck = await db.appUser.findUnique({ where: { userId: finalUserId } });
    if (finalCheck) {
      console.log('⚠️ Generated userId still exists, using timestamp-based fallback');
      finalUserId = `${slugify(name)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      console.log('🆔 Final fallback userId:', finalUserId);
    }
    
    // Generate unique loginSlug
    let loginSlug = crypto.randomBytes(8).toString('hex');
    let slugCounter = 1;
    
    // Check if loginSlug already exists and generate unique one
    while (true) {
      const existingUser = await db.appUser.findUnique({ where: { loginSlug } });
      if (!existingUser) {
        break;
      }
      loginSlug = `${crypto.randomBytes(8).toString('hex')}-${slugCounter}`;
      slugCounter++;
      
      // Prevent infinite loop
      if (slugCounter > 100) {
        loginSlug = `${crypto.randomBytes(8).toString('hex')}-${Date.now()}`;
        break;
      }
    }
    
    console.log('🔗 Generated loginSlug:', loginSlug);
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const roleIdNumberRaw = typeof roleId === 'string' ? (roleId.trim() === '' ? null : Number(roleId)) : roleId ?? null;
    let roleIdNumber: number | null = null;
    
    console.log('🔍 Role ID validation:', { roleId, roleIdNumberRaw, type: typeof roleId });
    
    if (typeof roleIdNumberRaw === 'number' && Number.isFinite(roleIdNumberRaw)) {
      try {
        const roleExists = await db.role.findUnique({ where: { id: roleIdNumberRaw } });
        roleIdNumber = roleExists ? roleIdNumberRaw : null;
        console.log('🔍 Role validation result:', { roleId: roleIdNumberRaw, exists: !!roleExists, finalRoleId: roleIdNumber });
      } catch (roleError) {
        console.error('❌ Role validation error:', roleError);
        roleIdNumber = null;
      }
    } else {
      console.log('⚠️ Invalid role ID format:', roleIdNumberRaw);
    }
    // Upsert by unique email to avoid 500 on duplicates
    const existing = await db.appUser.findUnique({ where: { email } });
    let saved;
    
    try {
      if (existing) {
        console.log('🔄 Updating existing user:', existing.email);
        const newLoginSlug = existing.loginSlug || loginSlug;
        saved = await db.appUser.update({
          where: { email },
          data: {
            name,
            status: status || existing.status,
            roleId: roleIdNumber,
            userId: finalUserId, // Always use the new userId
            loginSlug: newLoginSlug,
            passwordHash: password ? passwordHash : existing.passwordHash,
            phone: phone ?? existing.phone,
            avatarUrl: avatarUrl ?? existing.avatarUrl,
          }
        });
        console.log('✅ User updated successfully:', saved.id);
      } else {
        console.log('🆕 Creating new user with data:', { name, email, roleId: roleIdNumber, status, userId: finalUserId });
        saved = await db.appUser.create({
          data: {
            name,
            email,
            roleId: roleIdNumber,
            status: status || 'ACTIVE',
            userId: finalUserId,
            loginSlug,
            passwordHash,
            phone: phone || null,
            avatarUrl: avatarUrl || null,
          }
        });
        console.log('✅ User created successfully:', saved.id);
      }
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return NextResponse.json({ error: 'Database operation failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' }, { status: 500 });
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login/${saved.loginSlug}`;
    return NextResponse.json({ ...saved, loginUrl });
  } catch (e: any) {
    console.error('POST /api/auth/users failed:', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


