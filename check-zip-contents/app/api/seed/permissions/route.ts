import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from 'bcryptjs';

async function seedAll() {
  try {
    // 1) Seed permissions (resources x actions)
    const resources: string[] = [
      // Core sections
      'dashboard',
      'categories',
      'products',
      'inventory',
      'orders',
      'courier',
      'analytics',
      'finance',
      'users',
      // Settings subsections
      'settings:general',
      'settings:site',
      'settings:pixels',
      'settings:courier',
      'settings:bd-courier',
      'settings:email',
      // Finance detail modules
      'purchases',
      'expenses'
    ];
    const actions: string[] = ['view','create','update','delete'];

    console.log('Creating permissions...');
    for (const r of resources) {
      for (const a of actions) {
        try {
          await db.permission.upsert({
            where: { resource_action: { resource: r, action: a } },
            update: {},
            create: { resource: r, action: a }
          });
        } catch (e) {
          console.error(`Failed to create permission ${r}:${a}:`, e);
        }
      }
    }

    // 2) Seed roles
    const roleNames = [
      'Super Admin','Admin','Manager','Sales Manager','Salesman',
      'Purchase Manager','Inventory Manager','Finance Manager',
      'Support','Editor','Viewer'
    ];
    const roles = {} as Record<string, { id:number }>;
    
    console.log('Creating roles...');
    for (const name of roleNames) {
      try {
        const r = await db.role.upsert({ where: { name }, update: {}, create: { name } });
        roles[name] = { id: r.id };
        console.log(`Created role: ${name} (ID: ${r.id})`);
      } catch (e) {
        console.error(`Failed to create role ${name}:`, e);
      }
    }

    const perms = await db.permission.findMany();
    console.log(`Found ${perms.length} permissions`);

    const allowRole = async (roleName: string, checker: (p:{resource:string,action:string,id:number})=>boolean) => {
      const roleId = roles[roleName]?.id;
      if (!roleId) {
        console.error(`Role ${roleName} not found`);
        return;
      }
      
      console.log(`Setting permissions for role: ${roleName}`);
      for (const p of perms) {
        const allowed = checker(p);
        if (allowed) {
          try {
            await db.rolePermission.upsert({
              where: { roleId_permissionId: { roleId, permissionId: p.id } },
              update: { allowed: true },
              create: { roleId, permissionId: p.id, allowed: true }
            });
          } catch (e) {
            console.error(`Failed to create role permission for ${roleName} - ${p.resource}:${p.action}:`, e);
          }
        }
      }
    };

    // Super Admin / Admin / Manager: everything
    for (const all of ['Super Admin','Admin','Manager']) {
      await allowRole(all, () => true);
    }

    // Sales Manager: orders + products (CRUD)
    await allowRole('Sales Manager', (p) => (p.resource==='orders' || p.resource==='products'));

    // Salesman: orders (view,create), products(view)
    await allowRole('Salesman', (p)=> ( (p.resource==='orders' && (p.action==='view' || p.action==='create')) || (p.resource==='products' && p.action==='view') ));

    // Purchase Manager: purchases (CRUD), products(view)
    await allowRole('Purchase Manager', (p)=> (p.resource==='purchases' || (p.resource==='products' && p.action==='view')));

    // Inventory Manager: inventory(view,update), products(view)
    await allowRole('Inventory Manager', (p)=> ( (p.resource==='inventory' && (p.action==='view' || p.action==='update')) || (p.resource==='products' && p.action==='view') ));

    // Finance Manager: expenses (CRUD), orders(view)
    await allowRole('Finance Manager', (p)=> (p.resource==='expenses' || (p.resource==='orders' && p.action==='view')));

    // Support: orders(view,update), products(view)
    await allowRole('Support', (p)=> ( (p.resource==='orders' && (p.action==='view' || p.action==='update')) || (p.resource==='products' && p.action==='view') ));

    // Editor: products (CRUD)
    await allowRole('Editor', (p)=> (p.resource==='products'));

    // Viewer: only view everywhere
    await allowRole('Viewer', (p)=> p.action==='view');

    // 3) Create default Super Admin user if not exists
    console.log('Creating default Super Admin user...');
    const superAdminRoleId = roles['Super Admin']?.id;
    if (superAdminRoleId) {
      try {
        const existingAdmin = await db.appUser.findFirst({ 
          where: { 
            OR: [
              { id: 1 },
              { email: 'admin@nexus.com' }
            ]
          }
        });
        
        if (!existingAdmin) {
          const passwordHash = await bcrypt.hash('admin123', 10);
          const loginSlug = 'super-admin';
          
          console.log('Creating Super Admin user with:');
          console.log('- ID: 1');
          console.log('- User ID: admin');
          console.log('- Password hash length:', passwordHash.length);
          
          const adminUser = await db.appUser.create({
            data: {
              id: 1,
              name: 'Super Admin',
              email: 'admin@nexus.com',
              roleId: superAdminRoleId,
              status: 'ACTIVE',
              userId: 'admin',
              loginSlug,
              passwordHash,
              phone: '01700000000',
            }
          });
          
          console.log('✅ Default Super Admin created successfully:');
          console.log('Email: admin@nexus.com');
          console.log('Password: admin123');
          console.log('User ID: admin');
          console.log('Login URL: http://localhost:3000/login/admin');
        } else {
          console.log('ℹ️ Super Admin user already exists');
          console.log('Existing user data:', existingAdmin);
          
          // Update existing user's userId to 'admin' if it's different
          if (existingAdmin.userId !== 'admin') {
            console.log('🔄 Updating existing user userId to "admin"');
            await db.appUser.update({
              where: { id: existingAdmin.id },
              data: { userId: 'admin' }
            });
            console.log('✅ User ID updated successfully');
          }
        }
      } catch (error) {
        console.error('Failed to create Super Admin user:', error);
      }
    }

    console.log('Seeding completed successfully');
    return { ok: true, roles: roleNames.length, resources: resources.length, permissions: perms.length };
  } catch (error) {
    console.error('Seeding failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST() {
  const res = await seedAll();
  return NextResponse.json(res);
}

export async function GET() {
  const res = await seedAll();
  return NextResponse.json(res);
}


