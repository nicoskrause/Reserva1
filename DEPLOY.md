# Guia Rápido de Deploy — Vercel

## Opção A — Interface Web (mais fácil)

1. **Crie uma conta** em [vercel.com](https://vercel.com) (gratuito)

2. **Crie um repositório no GitHub:**
   - Acesse [github.com/new](https://github.com/new)
   - Nome sugerido: `underground-representacoes`
   - Deixe **Private** ✓ (sistema interno)
   - Clique em **Create repository**

3. **Suba os arquivos pelo GitHub:**
   - Clique em **"uploading an existing file"**
   - Arraste TODOS os arquivos desta pasta
   - Clique em **Commit changes**

4. **Importe na Vercel:**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Clique em **"Import Git Repository"**
   - Conecte sua conta GitHub se solicitado
   - Selecione o repositório `underground-representacoes`
   - Em **Framework Preset** → selecione **"Other"**
   - Clique em **Deploy** ✅

5. **Pronto!** Em ~30 segundos seu sistema estará online em um URL como:
   `https://underground-representacoes.vercel.app`

---

## Opção B — Terminal (Vercel CLI)

```bash
# Instalar o CLI da Vercel
npm install -g vercel

# Fazer login
vercel login

# Dentro da pasta do projeto, fazer deploy
vercel --prod
```

---

## Atualizar o sistema

Após o primeiro deploy, toda vez que você fizer commit no GitHub, a Vercel
faz o redeploy automaticamente em segundos.

```bash
git add .
git commit -m "atualização: descrição das mudanças"
git push
```

---

## Domínio personalizado (opcional)

Na dashboard da Vercel:
1. Selecione o projeto
2. Vá em **Settings → Domains**
3. Adicione seu domínio (ex: `sistema.undergroundrep.com.br`)
4. Siga as instruções de DNS

---

## Dúvidas frequentes

**Os dados são perdidos ao atualizar o site?**
Não. Os dados ficam no `localStorage` do navegador, independente das atualizações do sistema.

**Posso usar em celular?**
Sim, o layout é responsivo. Para melhor experiência, use em tablet ou desktop.

**O sistema é seguro?**
O acesso é protegido pela URL (não indexada por buscadores). Para maior segurança, configure **Vercel Password Protection** em Settings → Security.
