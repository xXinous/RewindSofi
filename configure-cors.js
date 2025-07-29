const { Storage } = require('@google-cloud/storage');

async function configureCORS() {
  try {
    // Inicializar o cliente do Storage
    const storage = new Storage({
      projectId: 'warpedsofi',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined
    });

    const bucketName = 'warpedsofi.firebasestorage.app';
    const bucket = storage.bucket(bucketName);

    // Configuração de CORS
    const corsConfiguration = [
      {
        origin: [
          'https://warpedsofi.web.app',
          'https://warpedsofi.firebaseapp.com',
          'http://localhost:3000',
          'http://localhost:3001'
        ],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type',
          'Authorization',
          'Content-Length',
          'User-Agent',
          'x-goog-resumable',
          'x-goog-encryption-algorithm',
          'x-goog-meta-*'
        ]
      }
    ];

    // Aplicar configuração de CORS
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ Configuração de CORS aplicada com sucesso!');
    console.log('Origins permitidos:', corsConfiguration[0].origin);
    console.log('Métodos permitidos:', corsConfiguration[0].method);
    
  } catch (error) {
    console.error('❌ Erro ao configurar CORS:', error.message);
    console.log('\n💡 Dicas para resolver:');
    console.log('1. Certifique-se de que você está logado no Google Cloud');
    console.log('2. Execute: gcloud auth login');
    console.log('3. Configure as credenciais: gcloud auth application-default login');
    console.log('4. Ou defina a variável GOOGLE_APPLICATION_CREDENTIALS');
  }
}

configureCORS(); 