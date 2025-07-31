# Troubleshooting - Comentários Não Persistem

## Problema Identificado
Os comentários aparecem apenas para o usuário que comentou e desaparecem quando ele sai da página.

## Possíveis Causas

### 1. 🔍 **Problema de Regras de Segurança**
- As regras podem estar bloqueando a leitura/escrita
- Verificar se `memoryId` está sendo validado corretamente

### 2. 🔍 **Problema de Índices**
- Índices compostos podem não estar criados
- Consultas com `orderBy` podem estar falhando

### 3. 🔍 **Problema de Sincronização**
- Comentário salvo mas não recarregado
- Estado local não sincronizado com Firestore

### 4. 🔍 **Problema de Autenticação**
- Usuário não autenticado corretamente
- Permissões insuficientes

## Debug Steps

### 1. **Verificar Console do Navegador**
Abra F12 e procure por:
```
=== INÍCIO DO ENVIO DE COMENTÁRIO ===
✅ Comentário salvo com sucesso no Firestore!
❌ Erro ao enviar comentário:
```

### 2. **Testar Conexão Firestore**
Se for admin, use o botão "Testar Conexão Firestore" na página.

### 3. **Verificar Firebase Console**
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Vá para Firestore Database
3. Verifique a coleção `comments`
4. Confirme se documentos estão sendo criados

### 4. **Verificar Regras de Segurança**
```bash
# Deploy das regras
firebase deploy --only firestore:rules
```

### 5. **Verificar Índices**
```bash
# Deploy dos índices
firebase deploy --only firestore:indexes

# Verificar status
firebase firestore:indexes
```

## Logs de Debug Adicionados

### **Envio de Comentário:**
```
=== INÍCIO DO ENVIO DE COMENTÁRIO ===
memoryId: [ID]
Usuário logado: [EMAIL]
Texto do comentário: [TEXTO]
Dados do comentário a serem enviados: [OBJETO]
Tentando salvar no Firestore...
✅ Comentário salvo com sucesso no Firestore!
ID do documento: [ID]
Recarregando comentários do Firestore...
Comentários carregados do Firestore: [NÚMERO]
✅ Comentários atualizados no estado!
```

### **Carregamento de Comentários:**
```
=== CARREGANDO COMENTÁRIOS ===
memoryId: [ID]
isAdmin: [BOOLEAN]
Fazendo query para comentários ativos...
✅ Comentários ativos carregados: [NÚMERO]
Comentários ativos: [ARRAY]
✅ Estado atualizado com comentários
```

## Soluções Implementadas

### 1. ✅ **Logs Detalhados**
- Adicionados logs em todas as operações
- Identificação clara de sucessos e falhas

### 2. ✅ **Recarregamento Automático**
- Após salvar, recarrega comentários do Firestore
- Garante sincronização com dados reais

### 3. ✅ **Validação de Regras**
- Adicionada validação de `memoryId` nas regras
- Verificação de todos os campos obrigatórios

### 4. ✅ **Função de Teste**
- Botão para testar conexão com Firestore
- Verifica leitura e escrita (admin apenas)

## Como Testar

### **Teste 1: Comentário Simples**
1. Faça login com Google
2. Tente criar um comentário
3. Verifique console para logs
4. Recarregue a página
5. Verifique se comentário persiste

### **Teste 2: Teste de Conexão (Admin)**
1. Faça login como admin
2. Clique em "Testar Conexão Firestore"
3. Verifique logs no console
4. Confirme se leitura e escrita funcionam

### **Teste 3: Verificação Manual**
1. Abra Firebase Console
2. Vá para Firestore Database
3. Verifique coleção `comments`
4. Confirme se documentos existem

## Estrutura de Dados Esperada

### **Documento de Comentário:**
```json
{
  "id": "auto-generated-id",
  "memoryId": "id-da-memoria",
  "text": "Texto do comentário",
  "userName": "Nome do usuário",
  "userEmail": "email@exemplo.com",
  "userPhoto": "https://...",
  "createdAt": "timestamp",
  "deleted": false
}
```

## Comandos de Deploy

```bash
# Deploy completo
firebase deploy

# Deploy apenas regras
firebase deploy --only firestore:rules

# Deploy apenas índices
firebase deploy --only firestore:indexes

# Deploy apenas hosting
firebase deploy --only hosting
```

## Próximos Passos

1. **Execute os testes** acima
2. **Verifique os logs** no console
3. **Confirme no Firebase Console** se dados estão sendo salvos
4. **Reporte os resultados** para análise adicional

---

**Nota**: Este guia deve ajudar a identificar exatamente onde está o problema. 