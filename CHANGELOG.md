# Changelog

## [1.2.0] - 2024-12-19

### Adicionado
- **Sistema completo de comentários**
  - Usuários logados com Google podem deixar comentários
  - Exibição de nome e foto de perfil do usuário
  - Data e hora dos comentários
  - Limite de 500 caracteres por comentário
  - Contador de caracteres em tempo real

- **Área de administração de comentários**
  - Visualização de todos os comentários ativos
  - Sistema de soft delete (comentários excluídos ficam ocultos)
  - Área separada para comentários excluídos
  - Funcionalidade de restaurar comentários excluídos
  - Exclusão permanente de comentários
  - Interface com tabs para organizar comentários ativos/excluídos

- **Melhorias na interface**
  - Botão de login Google para usuários não logados
  - Mensagem explicativa sobre necessidade de login
  - Ícones SVG para melhor experiência visual
  - Loading states durante operações

- **Segurança e regras do Firestore**
  - Regras de segurança para coleção `comments`
  - Validação de dados no frontend e backend
  - Controle de acesso baseado em autenticação
  - Soft delete para preservar histórico

### Técnico
- Nova coleção `comments` no Firestore
- Arquivo `firestore.rules` com regras de segurança
- Componentes React otimizados com `React.memo`
- Hooks personalizados para gerenciamento de estado
- Integração completa com Firebase Auth

## [1.1.0] - 2024-12-18

### Adicionado
- Seção "Secret Love" com charadas
- Upload de vídeos secretos
- Sistema de animações e transições
- Cronômetro de tempo juntos
- Player de música embutido (YouTube/Spotify)

## [1.0.0] - 2024-12-17

### Adicionado
- Sistema de criação de memórias
- Upload de fotos e vídeos
- Integração com YouTube e Spotify
- Autenticação Google
- Interface responsiva com Tailwind CSS 