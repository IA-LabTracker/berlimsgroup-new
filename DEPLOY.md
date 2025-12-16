# 🚀 Deploy no Vercel - Berlims Group

## 📋 Configuração Completa

Este projeto está totalmente configurado para deploy automático no Vercel com otimizações de performance e SEO.

### 📁 Arquivos de Configuração

- `vercel.json` - Configurações principais do projeto
- `.vercelignore` - Arquivos ignorados no deploy
- `.env.example` - Template das variáveis de ambiente

## Passos para Deploy

### 1. Conectar ao Vercel

```bash
npm i -g vercel
vercel login
```

### 2. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Project Settings > Environment Variables** e adicione:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_WEBHOOK_N8N=sua_url_do_webhook_n8n (opcional)
VITE_ENVIRONMENT=production
```

### 3. Deploy Manual (primeira vez)

```bash
vercel
```

### 4. Deploy Automático

Após a configuração inicial, todo push para `main` fará deploy automático.

## Características do Build

- **Framework**: Vite + React + TypeScript
- **Output**: Pasta `dist/`
- **SPA Routing**: Configurado com rewrites para `index.html`
- **Cache**: Assets com cache de 1 ano
- **Chunks**: Separação automática de vendor, supabase e router

## Estrutura de Deploy

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── vendor-[hash].js
│   └── index-[hash].css
└── ...outros arquivos
```

## URLs Importantes

- **Production**: https://seu-projeto.vercel.app
- **Preview**: URLs automáticas para cada PR
- **Dashboard**: https://vercel.com/dashboard

## Troubleshooting

### Build Fails

- Verifique se todas as dependências estão no `package.json`
- Confirme que o TypeScript compila sem erros: `npm run typecheck`

### Environment Variables

- Variáveis devem começar com `VITE_` para serem acessíveis no frontend
- Configure no painel do Vercel, não em arquivos `.env` commitados

### 404 Errors

- O `vercel.json` já está configurado para SPAs
- Todas as rotas redirecionam para `index.html`
