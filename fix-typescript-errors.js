const fs = require('fs');
const path = require('path');

// Function to fix TypeScript errors in route files
function fixRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix params type from { id: string } to Promise<{ id: string }>
    const paramsRegex = /{ params }: { params: { ([^}]+) } }/g;
    if (paramsRegex.test(content)) {
      content = content.replace(paramsRegex, '{ params }: { params: Promise<{ $1 }> }');
      modified = true;
    }

    // Fix params usage from params.id to await params
    const paramsUsageRegex = /params\.([a-zA-Z]+)/g;
    if (paramsUsageRegex.test(content)) {
      // Add await params at the beginning of try block
      const tryBlockRegex = /try\s*{/g;
      if (tryBlockRegex.test(content)) {
        content = content.replace(tryBlockRegex, (match) => {
          return match + '\n    const { $1 } = await params;';
        });
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Find all route files with [id] pattern
function findRouteFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item.includes('[') && item.includes(']')) {
          // This is a dynamic route directory
          const routeFiles = fs.readdirSync(fullPath);
          for (const routeFile of routeFiles) {
            if (routeFile === 'route.ts') {
              files.push(path.join(fullPath, routeFile));
            }
          }
        } else {
          scanDirectory(fullPath);
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Main execution
console.log('🔧 Fixing TypeScript errors in route files...');

const routeFiles = findRouteFiles('./app/api');
console.log(`Found ${routeFiles.length} route files to check`);

for (const file of routeFiles) {
  fixRouteFile(file);
}

console.log('✅ TypeScript error fixing completed!');
