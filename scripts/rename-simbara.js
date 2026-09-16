const fs = require('fs');
const path = require('path');

const directory = 'd:/0-SEMESTER 7/Ya-Website/SIPANDAI';
const ignoreDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

function replaceInFile(filePath) {
    if (!filePath.match(/\.(tsx|ts|js|json|md|example|env)$/)) return;
    if (filePath.endsWith('package-lock.json')) return; // Skip lock file, will regenerate
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    // 1. Replace the long name first
    content = content.replace(/Sistem Informasi Pemantauan dan Tindak Lanjut Administrasi Internal/gi, 'Sistem Informasi Pemantauan dan Tindak Lanjut Administrasi Internal');
    
    // 2. Replace SIPANDAI
    content = content.replace(/SIPANDAI/g, 'SIPANDAI');
    
    // 3. Replace sipandai
    content = content.replace(/sipandai/g, 'sipandai');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.includes(file)) continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

walk(directory);
