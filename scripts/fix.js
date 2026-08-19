const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
let count = 0;
for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('\\`') || content.includes('\\$')) {
      content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${file}`);
      count++;
    }
  }
}
console.log(`Fixed ${count} files.`);
