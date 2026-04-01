const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const files = getFiles('./src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const imports = new Set();
const regex = /from\s+['"]([^'".\\]+)['"]/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    let mod = match[1];
    if (!mod.startsWith('.')) {
      if (mod.startsWith('@')) {
        imports.add(mod.split('/').slice(0, 2).join('/'));
      } else {
        imports.add(mod.split('/')[0]);
      }
    }
  }
});

const pkg = require('./package.json');
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

const missing = Array.from(imports).filter(imp => !allDeps[imp] && imp !== 'react' && imp !== 'react-native');
console.log('Missing dependencies:', missing);
