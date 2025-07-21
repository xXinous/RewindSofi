# Cápsula do Tempo Digital - Wrapped

Este é um app web React para criar cápsulas do tempo digitais, com mensagens, fotos, música e uma seção secreta protegida por senha.

## Como rodar localmente

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repo>
   cd sofi
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Rode o app em modo desenvolvimento:**
   ```bash
   npm start
   ```
   O app estará disponível em `http://localhost:3000`.

## Build para produção

```bash
npm run build
```
Os arquivos finais estarão na pasta `build/`.

## Deploy no Firebase Hosting

1. Instale a CLI do Firebase (se ainda não tiver):
   ```bash
   npm install -g firebase-tools
   ```
2. Faça login na sua conta Google:
   ```bash
   firebase login
   ```
3. Inicialize o Firebase Hosting no projeto (responda as perguntas, escolha "build" como pasta pública):
   ```bash
   firebase init hosting
   ```
4. Faça o deploy:
   ```bash
   npm run build
   firebase deploy
   ```

### Exemplo de `firebase.json`:
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

## Tecnologias usadas
- React 18
- TailwindCSS
- Create React App

---

Feito com 💚 