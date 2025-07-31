# RewindSofi

Uma aplicação web para criar e compartilhar memórias especiais com música, fotos e mensagens personalizadas.

## Funcionalidades

### Para Usuários Visitantes
- Visualizar memórias compartilhadas
- Fazer login com Google para deixar comentários
- Ver comentários de outros usuários com foto de perfil e nome

### Para Usuários Logados (Google)
- Todas as funcionalidades de visitantes
- Deixar comentários nas memórias
- Ver comentários de outros usuários

### Para Administrador (marcelop.smile@gmail.com)
- Criar e editar memórias
- Upload de fotos e vídeos
- Configurar música (YouTube/Spotify)
- Seção "Secret Love" com charadas e conteúdo especial
- **Nova funcionalidade**: Administração completa de comentários
  - Visualizar todos os comentários ativos
  - Excluir comentários (soft delete)
  - Restaurar comentários excluídos
  - Excluir permanentemente comentários
  - Ver comentários excluídos em área separada

## Estrutura de Comentários

### Funcionalidades dos Comentários
- **Criação**: Apenas usuários logados com Google podem comentar
- **Visualização**: Todos podem ver comentários ativos
- **Moderação**: Apenas o administrador pode excluir/restaurar comentários
- **Dados salvos**: Nome, email, foto de perfil, texto, data/hora
- **Limite**: 500 caracteres por comentário

### Área de Administração
- **Comentários Ativos**: Lista todos os comentários visíveis
- **Comentários Excluídos**: Lista comentários removidos (soft delete)
- **Ações disponíveis**:
  - Excluir comentário (move para área de excluídos)
  - Restaurar comentário (move de volta para ativos)
  - Excluir permanentemente (remove do banco)

## Tecnologias

- **Frontend**: React.js com Tailwind CSS
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Autenticação**: Google Sign-In
- **Música**: YouTube e Spotify embutidos
- **Armazenamento**: Firebase Storage para fotos e vídeos

## Configuração

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o Firebase no arquivo `src/firebase.js`
4. Execute: `npm start`

## Estrutura do Banco de Dados

### Coleção: `memorias`
- `title`: Título da memória
- `message`: Mensagem principal
- `musicUrl`: URL da música
- `musicTitle`: Título da música
- `musicArtist`: Artista da música
- `coupleNames`: Nomes do casal
- `startDate`: Data de início
- `photos`: Array de URLs das fotos
- `secretLoveEnabled`: Boolean para seção especial
- `secretVideo`: URL do vídeo secreto
- `secretMessage`: Mensagem secreta
- `createdAt`: Timestamp de criação

### Coleção: `comments` (NOVA)
- `memoryId`: ID da memória relacionada
- `text`: Texto do comentário
- `userName`: Nome do usuário
- `userEmail`: Email do usuário
- `userPhoto`: URL da foto de perfil
- `createdAt`: Timestamp de criação
- `deleted`: Boolean para soft delete

## Regras de Segurança

### Firestore
- **memorias**: Leitura pública, escrita apenas para admin
- **comments**: Leitura de comentários ativos para todos, criação para usuários logados, moderação apenas para admin

### Storage
- Acesso temporário para resolver problemas de CORS

## Deploy

```bash
npm run build
firebase deploy
```

## Versão

Atual: 1.2.0 - Adicionada funcionalidade completa de comentários 