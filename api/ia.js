// Assistente de IA do sistema (ChatGPT / OpenAI) — função privada da Vercel.
//
// Segurança:
//  - Só atende quem está logado no sistema: confere o token do Firebase do usuário a cada chamada.
//  - A chave da OpenAI fica na variável de ambiente OPENAI_API_KEY (painel da Vercel), nunca no site.
//  - Os dados NÃO ficam aqui: as consultas ("ferramentas") rodam no navegador do usuário logado,
//    com as permissões dele, e só o resultado necessário volta para a conversa.
//
// Configuração na Vercel (Settings → Environment Variables):
//   OPENAI_API_KEY  (obrigatória)
//   OPENAI_MODEL    (opcional; padrão abaixo)

const FIREBASE_WEB_KEY = 'AIzaSyAVXZ_zKL2IRKicLTjP1l58OSVJq-VbZF8'; // chave pública do app web (a mesma do site)
// Modelos tentados, em ordem, quando OPENAI_MODEL não estiver definido ou não for aceito pela conta
const MODELOS_RESERVA = ['gpt-5.4-mini', 'gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini'];
const MAX_MENSAGENS = 40;
const MAX_TEXTO = 24000;

const SISTEMA = `Você é o Robertão, o assistente do sistema de gestão da Underground Representações, um escritório de representação comercial / showroom de moda (marcas como Reserva, Aramis, Foxton, Cacay, Nike…) que vende coleções sazonais (verão, alto verão, inverno, alto inverno) para lojistas.

Como responder:
- Seu nome é Robertão. Se perguntarem quem você é, apresente-se como Robertão, o assistente da Underground.
- Sempre em português do Brasil, de forma curta, clara e prática. Use listas quando ajudar. Valores em reais (R$).
- Para qualquer número, cliente, venda, meta, pedido ou atraso, CONSULTE as ferramentas. Nunca invente dados. Se a ferramenta não trouxer a informação, diga que não encontrou.
- Você só lê os dados; não consegue alterar nada no sistema. Quando fizer sentido, diga qual tela usar (ex.: "lance o pedido em CRM Under → Clientes → Novo pedido").
- Quando pedirem uma mensagem para cliente (cobrança, convite para coleção, retorno), escreva pronta para copiar, cordial e sem ameaças.
- "Ativo" numa marca = comprou em uma das últimas coleções já vendidas da marca. A coleção em venda não conta para isso.
- O usuário só enxerga as marcas que tem permissão; as ferramentas já respeitam isso.`;

const FERRAMENTAS = [
  {
    type: 'function',
    function: {
      name: 'buscar_clientes',
      description: 'Lista clientes com filtros. Use para perguntas como "quem são os clientes inativos da Reserva em Pelotas" ou "clientes com atraso".',
      parameters: {
        type: 'object',
        properties: {
          texto: { type: 'string', description: 'Parte do nome da loja ou da razão social' },
          marca: { type: 'string', description: 'Nome da marca (ex.: Reserva)' },
          cidade: { type: 'string' },
          status: { type: 'string', enum: ['ativo', 'inativo', 'todos'] },
          so_inadimplentes: { type: 'boolean' },
          limite: { type: 'number', description: 'Máximo de clientes (padrão 20)' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detalhe_cliente',
      description: 'Tudo sobre um cliente: compras por coleção e marca, status por marca, pedidos, títulos em atraso, rede de lojas, contatos e histórico de contatos.',
      parameters: {
        type: 'object',
        properties: { cliente: { type: 'string', description: 'Nome da loja (ou "atual" para o cliente aberto na tela)' } },
        required: ['cliente'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumo_colecao',
      description: 'Desempenho de uma coleção por marca: vendido, meta, clientes que compraram, clientes que costumam comprar e ainda não compraram, comparação com o ano anterior.',
      parameters: {
        type: 'object',
        properties: {
          colecao: { type: 'string', description: 'Ex.: Inverno 27. Vazio = a coleção mais recente com vendas' },
          marca: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clientes_sem_comprar',
      description: 'Clientes que compraram nas últimas coleções de uma marca e ainda não compraram a coleção indicada (oportunidades de venda).',
      parameters: {
        type: 'object',
        properties: { marca: { type: 'string' }, colecao: { type: 'string' }, limite: { type: 'number' } },
        required: ['marca'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inadimplencia',
      description: 'Títulos em atraso (da tela Inadimplência), com cliente, marca, valor, dias de atraso, status e anotações.',
      parameters: {
        type: 'object',
        properties: { marca: { type: 'string' }, minimo_dias: { type: 'number' }, limite: { type: 'number' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pedidos',
      description: 'Pedidos lançados no sistema, com filtros por cliente, marca e coleção.',
      parameters: {
        type: 'object',
        properties: { cliente: { type: 'string' }, marca: { type: 'string' }, colecao: { type: 'string' }, limite: { type: 'number' } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tarefas_do_dia',
      description: 'A lista de contatos de hoje de um gestor (a mesma da aba Tarefas do dia), com o motivo de cada um.',
      parameters: { type: 'object', properties: { gestor: { type: 'string' } }, additionalProperties: false },
    },
  },
];

async function usuarioLogado(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  try {
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_WEB_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return (d.users && d.users[0] && d.users[0].email) || null;
  } catch {
    return null;
  }
}

function mensagensValidas(lista) {
  if (!Array.isArray(lista) || !lista.length || lista.length > MAX_MENSAGENS) return null;
  const ok = [];
  for (const m of lista) {
    if (!m || !['user', 'assistant', 'tool'].includes(m.role)) return null;
    const conteudo = m.content == null ? null : String(m.content).slice(0, MAX_TEXTO);
    if (m.role === 'tool') ok.push({ role: 'tool', tool_call_id: String(m.tool_call_id || ''), content: conteudo || '' });
    else if (m.role === 'assistant') ok.push(m.tool_calls ? { role: 'assistant', content: conteudo, tool_calls: m.tool_calls } : { role: 'assistant', content: conteudo || '' });
    else ok.push({ role: 'user', content: conteudo || '' });
  }
  return ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST' });

  const email = await usuarioLogado(req);
  if (!email) return res.status(401).json({ erro: 'Faça login no sistema para usar o assistente.' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ erro: 'O assistente ainda não foi configurado (falta a chave da OpenAI na Vercel).' });

  const corpo = req.body || {};
  const mensagens = mensagensValidas(corpo.mensagens);
  if (!mensagens) return res.status(400).json({ erro: 'Conversa inválida.' });
  const tela = String(corpo.tela || '').slice(0, 600);

  try {
    // Tenta o modelo configurado; se ele não existir/não for aceito na conta, tenta os "mini" mais comuns.
    const modelos = [...new Set([String(process.env.OPENAI_MODEL || '').trim(), ...MODELOS_RESERVA].filter(Boolean))];
    let r, d;
    for (const model of modelos) {
      r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SISTEMA + (tela ? '\n\nO usuário está agora em: ' + tela : '') + '\nHoje é ' + new Date().toLocaleDateString('pt-BR') + '.' }, ...mensagens],
          tools: FERRAMENTAS,
          user: email, // ajuda a OpenAI a identificar abuso por usuário (não é exibido)
        }),
      });
      d = await r.json().catch(() => ({}));
      const erroDeModelo = !r.ok && (r.status === 404 || (d && d.error && (d.error.code === 'model_not_found' || /model/i.test(String(d.error.param || '') + ' ' + String(d.error.message || '')))));
      if (!erroDeModelo) break;
      console.error('[ia] modelo recusado:', model, r.status, d && d.error && d.error.message);
    }
    if (!r.ok) {
      console.error('[ia] OpenAI', r.status, d && d.error && d.error.message);
      const codigo = d && d.error && d.error.code;
      const msg =
        codigo === 'insufficient_quota'
          ? 'O Robertão está sem créditos: adicione saldo na conta da OpenAI (platform.openai.com → Billing).'
          : r.status === 401
            ? 'Chave da OpenAI inválida — confira na Vercel.'
            : codigo === 'model_not_found'
              ? 'O modelo configurado (OPENAI_MODEL) não existe na sua conta da OpenAI — confira o nome na Vercel.'
              : r.status === 429
                ? 'Muitas perguntas seguidas ou limite de gasto atingido. Tente em instantes.'
                : 'A IA está indisponível agora.';
      // o código ajuda a diagnosticar (não contém dados nem a chave)
      return res.status(502).json({ erro: msg + ' [' + r.status + (codigo ? ' · ' + codigo : '') + ']' });
    }
    const msg = d.choices && d.choices[0] && d.choices[0].message;
    if (!msg) return res.status(502).json({ erro: 'A IA não respondeu.' });
    return res.status(200).json({ mensagem: { role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls || undefined } });
  } catch (e) {
    console.error('[ia]', e);
    return res.status(500).json({ erro: 'Erro inesperado no assistente.' });
  }
};
