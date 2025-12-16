#!/usr/bin/env node

// Script de primeira configuração para deploy no Vercel
console.log("🚀 Berlims Group - Setup para Deploy no Vercel");
console.log("");
console.log("📋 Checklist antes do deploy:");
console.log("");
console.log("✅ Arquivos de configuração criados:");
console.log("   - vercel.json (configurações do projeto)");
console.log("   - .vercelignore (arquivos ignorados)");
console.log("   - public/_headers (headers de segurança)");
console.log("   - public/_redirects (SPA routing)");
console.log("   - .nvmrc (versão do Node.js)");
console.log("");
console.log("⚠️  PRÓXIMOS PASSOS:");
console.log("");
console.log("1. Configure as variáveis de ambiente no Vercel:");
console.log("   VITE_SUPABASE_URL=https://seu-projeto.supabase.co");
console.log("   VITE_SUPABASE_ANON_KEY=sua_chave_anonima");
console.log("");
console.log("2. Execute o deploy:");
console.log("   npm run deploy");
console.log("");
console.log("3. Ou conecte seu repositório GitHub ao Vercel para");
console.log("   deploys automáticos a cada push.");
console.log("");
console.log("📖 Documentação completa: ./DEPLOY.md");
console.log("");
console.log("🎉 Projeto pronto para produção!");
