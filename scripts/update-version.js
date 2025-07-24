const fs = require('fs');
const path = require('path');

// Ler a versão atual do package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

// Atualizar o arquivo de versão
const versionContent = `// Configuração de versão da aplicação
// Este arquivo é atualizado automaticamente durante o build
export const APP_VERSION = '${currentVersion}';
export const BUILD_TIMESTAMP = ${Date.now()};

// Função para verificar se há uma nova versão disponível
export const checkForUpdates = () => {
  const currentVersion = localStorage.getItem('app_version');
  
  if (currentVersion !== APP_VERSION) {
    localStorage.setItem('app_version', APP_VERSION);
    return true; // Nova versão detectada
  }
  
  return false; // Mesma versão
};

// Função para forçar atualização
export const forceUpdate = () => {
  // Limpa cache do service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }
  
  // Força recarregamento
  window.location.reload(true);
};
`;

// Atualizar o arquivo version.js
fs.writeFileSync('src/version.js', versionContent);

// Atualizar o index.html com a nova versão
const indexPath = 'public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Atualizar a versão no script do index.html
indexContent = indexContent.replace(
  /const currentVersion = ['"][^'"]*['"];/,
  `const currentVersion = '${currentVersion}';`
);

fs.writeFileSync(indexPath, indexContent);

console.log(`✅ Versão atualizada para ${currentVersion}`);
console.log(`✅ Timestamp atualizado: ${new Date().toLocaleString()}`); 