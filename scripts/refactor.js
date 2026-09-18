const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');
const PRISMA_DIR = path.join(__dirname, '..', 'prisma');
const ROOT_FILES = ['package.json', 'sipandai_erd.sql', 'README.md'];

// Words to replace
const REPLACEMENTS = [
  // SIMBARA -> SIPANDAI
  { from: /\bSIMBARA\b/g, to: 'SIPANDAI' },
  { from: /\bSimbara\b/g, to: 'Sipandai' },
  { from: /\bsimbara\b/g, to: 'sipandai' },

  // ATK -> Persediaan
  { from: /transaksi_atk/g, to: 'transaksi_persediaan' },
  { from: /transaksi_atk_id/g, to: 'transaksi_persediaan_id' },
  { from: /TransaksiAtk/g, to: 'TransaksiPersediaan' },
  { from: /transaksiAtk/g, to: 'transaksiPersediaan' },
  { from: /\bATK\b/g, to: 'Persediaan' },
  { from: /\bAtk\b/g, to: 'Persediaan' },
  { from: /\batk\b/g, to: 'persediaan' },
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  // Skip binary/compiled files
  if (filePath.includes('node_modules') || filePath.includes('.next') || filePath.includes('.git')) return;
  if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.ico')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated file: ${filePath}`);
  }
}

// 1. Process files
console.log('Processing files...');
processDirectory(ROOT_DIR);
processDirectory(PRISMA_DIR);
processDirectory(path.join(__dirname, '..', '__tests__'));

for (const file of ROOT_FILES) {
  const fp = path.join(__dirname, '..', file);
  if (fs.existsSync(fp)) {
    processFile(fp);
  }
}

console.log('Refactoring complete!');
