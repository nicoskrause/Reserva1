# Underground Representações — Sistema de Gestão

> Sistema interno de CRM e controle comercial para representação de moda.

---

## Visão Geral

Aplicação web **100% client-side** (sem back-end, sem banco de dados externo). Todos os dados são armazenados no `localStorage` do navegador, tornando o deploy trivial em qualquer hospedagem de arquivos estáticos como a **Vercel**.

### Módulos disponíveis

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs principais, gráficos por coleção e desempenho por cidade |
| **Clientes** | Cadastro completo com CNPJ, endereço, telefone e LTV |
| **Compras por Coleção** | Tabela editável com 9 coleções (Alto V.25 → Verão 27 + Perfumes) |
| **Rankings** | Ranking de clientes por volume de compras (geral ou por coleção) |
| **Artigos** | Catálogo de produtos por cliente e coleção com exportação CSV |
| **Agenda** | Eventos e compromissos com data, cliente e notas |
| **CRM** | Kanban de clientes VIP / Regular / Ocasional + prospecção |

---

## Deploy na Vercel

### Pré-requisitos

- Conta na [Vercel](https://vercel.com) (gratuita)
- [Node.js](https://nodejs.org) ≥ 18 (apenas para rodar localmente)
- [Git](https://git-scm.com)

### Passo a passo

#### 1. Clonar / inicializar o repositório

```bash
git init
git add .
git commit -m "feat: deploy inicial Underground Representações"
```

#### 2. Publicar no GitHub (ou GitLab / Bitbucket)

```bash
# Crie um repositório no GitHub e então:
git remote add origin https://github.com/SEU-USUARIO/underground-representacoes.git
git branch -M main
git push -u origin main
```

#### 3. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `underground-representacoes`
4. Em **Framework Preset**, selecione **"Other"**
5. Deixe **Build Command** e **Output Directory** em branco
6. Clique em **Deploy** ✅

A Vercel detectará automaticamente o `vercel.json` e fará o deploy do site estático.

#### Alternativa — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Rodar Localmente

```bash
npm install
npm run dev
# Acesse: http://localhost:3000
```

---

## Estrutura de Arquivos

```
underground-representacoes/
├── index.html          # Aplicação completa (HTML + CSS + JS inline)
├── vercel.json         # Configuração de deploy e headers HTTP
├── package.json        # Scripts de desenvolvimento local
├── .gitignore          # Arquivos ignorados pelo Git
└── README.md           # Esta documentação
```

---

## Armazenamento de Dados

> ⚠️ **Importante:** os dados ficam no `localStorage` do navegador. Eles **não são compartilhados** entre dispositivos ou usuários diferentes.

| Chave localStorage | Conteúdo |
|---|---|
| `und_clientes` | Array de objetos com cadastro dos clientes |
| `und_compras` | Array com compras por coleção por CNPJ |
| `und_arts_*` | Artigos por cliente e coleção |
| `und_agenda` | Eventos agendados |

### Backup e Restauração

No menu lateral, acesse **Dashboard → Exportar Tudo** para baixar um arquivo `underground_backup.json` com todos os dados. Para restaurar, use o botão **Importar Backup** na mesma tela.

---

## Coleções Cadastradas

| ID interno | Nome exibido |
|---|---|
| `Alto verão 25` | Alto Verão 25 |
| `Inverno 25` | Inverno 25 |
| `Alto inverno 25` | Alto Inverno 25 |
| `Verão 26` | Verão 26 |
| `Alto verão 26` | Alto Verão 26 |
| `Inverno 26` | Inverno 26 |
| `Alto Inv 26` | Alto Inverno 26 |
| `Verão 27` | Verão 27 |
| `Perfumes` | Perfumes |

---

## Tecnologias Utilizadas

- **HTML5 / CSS3 / JavaScript** — sem frameworks
- **Chart.js 4.4** — gráficos de barras e rosca
- **Google Fonts** — DM Serif Display, DM Sans, JetBrains Mono
- **localStorage API** — persistência de dados no browser

---

## Segurança

O `vercel.json` inclui headers HTTP de segurança:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Licença

Uso interno — Underground Representações. Todos os direitos reservados.
