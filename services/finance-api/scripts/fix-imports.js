const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const p1 = /from\s+['"]@prisma\/client['"]/g;
      if (p1.test(content)) {
        content = content.replace(p1, "from '@/utils/prisma'");
        changed = true;
      }
      
      const p2 = /from\s+['"]@prisma\/client\/runtime\/client['"]/g;
      if (p2.test(content)) {
        content = content.replace(p2, "from '@/utils/prisma'");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}
walk(path.join(__dirname, 'src'));
console.log('Done');
