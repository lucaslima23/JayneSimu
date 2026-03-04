const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'vite.config.ts',
    'src/components/layout/MainLayout.tsx',
    'README.md',
    'public/manifest.webmanifest',
    'index.html'
];

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/Residência Médica/gi, 'Cursinhos Preparatórios');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    } catch (e) {
        console.error(`Error updating ${file}:`, e.message);
    }
});
