// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.5.0, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';   // 4o (até 128 k)

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* ───────── cache simples em memória ───────── */
const KEEP_DAYS = 3;
/** @type {Map<string, number>} */
globalThis.recentVerses = globalThis.recentVerses || new Map();

function purgeOld() {
  const ttl = KEEP_DAYS * 86_400_000;         // ms em 3 dias
  const now = Date.now();
  for (const [ref, t] of globalThis.recentVerses)
    if (now - t > ttl) globalThis.recentVerses.delete(ref);
}
function addRef(ref)     { globalThis.recentVerses.set(ref, Date.now()); }
function getBlacklist()  { purgeOld(); return [...globalThis.recentVerses.keys()]; }

/* ───────────────── handler ─────────────────── */
export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) return jsonErr('Digite algo 🙏', 400);

    const blacklist = getBlacklist();

    /* prompt gerado na hora */
    const makePrompt = (avoid = []) => `
O usuário compartilhou: "${entryText}"

TAREFA
1. Escolha um trecho do Novo Testamento (1–3 versículos consecutivos) que ofereça acolhimento e orientação.
2. Não use estes, pois apareceram recentemente: ${avoid.length ? avoid.join('; ') : '—'}.
3. Depois escreva DOIS parágrafos:
   • Contexto Bíblico  – ≤ 120 palavras  
   • Aplicação Pessoal – ≤ 120 palavras
4. Formato EXATO (não acrescente linhas extras):

Trecho: "Texto completo do trecho"          ← mantenha as aspas
Referência: Livro Cap:Vers-[Vers]            ← ex.: Mateus 11:28-30

Contexto: …

Aplicação: …
`.trim();

    const MAX_RETRIES = 3;
    let reference = '';
    let responseText = '';

    for (let i = 0; i < MAX_RETRIES; i++) {
      const { choices } = await openai.chat.completions.create({
        model: MODEL_ID,
        temperature: 0.7,
        max_tokens: 850,
        messages: [
          { role: 'system',    content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
          { role: 'assistant', content: 'Siga exatamente o formato; evite tom acadêmico.' },
          { role: 'user',      content: makePrompt(blacklist) },
        ],
      });

      responseText = choices?.[0]?.message?.content?.trim() || '';

      /* 1ª tentativa: novo formato "Referência:" */
      let m = responseText.match(/Referência:\s*([^\n]+)/i);
      /* 2ª tentativa: formato antigo em parênteses */
      if (!m) m = responseText.match(/Trecho:\s*".*?"\s*\(([^)]+)\)/i);

      reference = m ? m[1].replace(/\s+/g, '') : '';

      if (!reference || blacklist.includes(reference)) {
        blacklist.push(reference || `retry-${i}`);
        continue;        // tenta de novo
      }
      break;             // ok
    }

    if (!reference)
      return jsonErr('Não encontrei um trecho inédito.', 502);

    addRef(reference);

    const context =
      (/Contexto:\s*([\s\S]+?)Aplicação:/i.exec(responseText)?.[1] || '')
        .trim();
    const application =
      (/Aplicação:\s*([\s\S]+)$/i.exec(responseText)?.[1] || '')
        .trim();

    return Response.json({ reference, context, application });

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return jsonErr('⚠️ Problema interno. Tente novamente.', 500);
  }
};

/* ───────── util ───────── */
function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
