// Configuração de versão da aplicação
// Este arquivo é atualizado automaticamente durante o build
export const APP_VERSION = '1.2.0';
export const BUILD_TIMESTAMP = 1754005567759;

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
