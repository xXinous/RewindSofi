# Changelog

## [2024-07-29] - Atualização de Dependências e Acessibilidade

### 🔧 Correções
- **Resolvido aviso de depreciação**: Removida a propriedade `-ms-high-contrast` que estava sendo descontinuada
- **Atualização do Tailwind CSS**: Migrado para a versão 4.1.11 com melhor suporte para acessibilidade
- **Atualização do Autoprefixer**: Atualizado para a versão 10.4.21 com configurações modernas
- **Atualização do PostCSS**: Atualizado para a versão 8.5.6
- **Correção do plugin PostCSS**: Instalado `@tailwindcss/postcss` para compatibilidade com Tailwind v4

### ✨ Melhorias de Acessibilidade
- **Novas classes utilitárias**: Adicionadas classes `.focus-visible`, `.sr-only`, `.high-contrast`, `.reduced-motion`
- **Cores acessíveis**: Implementado sistema de cores com melhor contraste
- **Suporte a preferências de movimento**: Respeita a configuração `prefers-reduced-motion`
- **Foco melhorado**: Contornos de foco mais visíveis e acessíveis

### 🎨 Novas Animações
- **Animações suaves**: Adicionadas animações `fade-in`, `slide-up`, `scale-in`
- **Transições otimizadas**: Melhor performance e suporte a dispositivos de baixo poder
- **Keyframes personalizados**: Animações customizadas para melhor UX

### 📱 Configurações de Navegador
- **Browserslist atualizado**: Removido suporte ao IE 11 e adicionado suporte ao Edge
- **Configurações modernas**: Foco em navegadores modernos com melhor suporte a acessibilidade

### 🔄 Configurações do Autoprefixer
- **Flexbox moderno**: Configurado para usar especificação moderna do flexbox
- **Grid autoplace**: Suporte automático para CSS Grid
- **Propriedades depreciadas**: Desabilitadas propriedades que causam avisos

### 📋 Como Usar as Novas Classes

```css
/* Para elementos que precisam de foco visível */
.focus-visible

/* Para texto que deve ser lido por leitores de tela mas não visível */
.sr-only

/* Para melhorar contraste em modo escuro */
.high-contrast

/* Para respeitar preferências de movimento reduzido */
.reduced-motion
```

### 🚀 Benefícios
- ✅ Eliminados avisos de depreciação no console
- ✅ Melhor acessibilidade para usuários com deficiências visuais
- ✅ Performance otimizada para dispositivos móveis
- ✅ Suporte moderno a navegadores atuais
- ✅ Código mais limpo e mantível 