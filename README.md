# Cápsula do Tempo Digital (Firebase)

Plataforma web para criar cápsulas do tempo digitais com persistência no Firebase (Firestore + Storage).

## Como rodar
1. Instale as dependências:
   ```
   npm install
   ```
2. Configure o arquivo `src/firebase.js` com suas credenciais do Firebase.
3. Rode o projeto:
   ```
   npm start
   ```

## Deploy Firebase Hosting
1. Instale o Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
2. Faça login:
   ```
   firebase login
   ```
3. Inicialize o projeto:
   ```
   firebase init
   ```
4. Faça build e deploy:
   ```
   npm run build
   firebase deploy
   ```

## Stack
- React 18
- Firebase (Auth, Firestore, Storage)
- TailwindCSS
- react-qr-code

## Limitações
- Apenas usuários autenticados anonimamente podem criar cápsulas.
- As fotos são salvas no Firebase Storage. 