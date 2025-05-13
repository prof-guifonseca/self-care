// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.4.1, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
// ID oficial do GPT-4o (128 k suportado)
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* ============== cache simples em memória ============== */
const KEEP_DAYS = 3;
/** @type {Map<string, number>} */
globalThis.recentVerses = globalThis.recentVerses || new Map();

function purgeOld() {
  const ttl = KEEP_DAYS * 86_400_000;
  const now = Date.now();
  for (const [ref, t] of globalThis.recentVerses)
    if (now - t > ttl) globalThis.recentVerses.delete(ref);
}
function addRef(ref) { globalThis.recentVerses.set(ref, Date.now()); }
function getBlacklist() { purgeOld(); return [...globalThis.recentVerses.keys()]; }

/* ======================== handler ======================= */
export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) return jsonErr('Digite algo 🙏', 400);

    const blacklist = getBlacklist();

    /** cria prompt com lista de trechos a evitar */
    const makePrompt = (avoid = []) => `
O usuário compartilhou: "${entryText}"

TAREFA
1. Escolha um trecho do Novo Testamento, 1 a 3 versículos consecutivos, que ofereça acolhimento e orientação.
2. Não use nenhum destes, pois foram usados recentemente: ${avoid.length ? avoid.join('; ') : '—'}.
3. Depois escreva DOIS parágrafos:
   • Contexto Bíblico  – ≤ 120 palavras  
   • Aplicação Pessoal – ≤ 120 palavras
4. Formato EXATO:

Trecho: "Texto" (Livro Cap:Vers-[Vers])

Contexto: …

Aplicação: …
`.trim();

    const MAX_RETRIES = 3;
    let passage = '';
    let responseText = '';

    for (let i = 0; i < MAX_RETRIES; i++) {
      const { choices } = await openai.chat.completions.create({
        model: MODEL_ID,
        temperature: 0.7,
        max_tokens: 850,          // ajuste conforme sua necessidade/custo
        messages: [
          { role: 'system',    content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
          { role: 'assistant', content: 'Siga o formato solicitado; nada de tom acadêmico.' },
          { role: 'user',      content: makePrompt(blacklist) },
        ],
      });

      responseText = choices?.[0]?.message?.content?.trim() || '';

      // capturar referência em parênteses
      const m = responseText.match(/Trecho:\s*".*"\s*\(([^)]+)\)/i);
      passage = m ? m[1].replace(/\s+/g, '') : '';

      if (!passage || blacklist.includes(passage)) {
        blacklist.push(passage || `retry-${i}`);
        continue;
      }
      break;
    }

    if (!passage) return jsonErr('Não encontrei um trecho inédito.', 502);

    addRef(passage);

    const context     = (/Contexto:\s*([\s\S]+?)Aplicação:/i.exec(responseText)?.[1] || '').trim();
    const application = (/Aplicação:\s*([\s\S]+)$/i.exec(responseText)?.[1] || '').trim();

    return Response.json({ passage, context, application });

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return jsonErr('⚠️ Problema interno. Tente novamente.', 500);
  }
};

/* ---------- util ---------- */
function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
