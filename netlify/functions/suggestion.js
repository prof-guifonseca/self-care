// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.5.1, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';  // suporta até 128 k

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* ─── cache simples em memória ─── */
const KEEP_DAYS = 3;
/** @type {Map<string, number>} */
globalThis.recentRefs = globalThis.recentRefs || new Map();

function purgeOld() {
  const ttl = KEEP_DAYS * 86_400_000;
  const now = Date.now();
  for (const [ref, t] of globalThis.recentRefs)
    if (now - t > ttl) globalThis.recentRefs.delete(ref);
}
function addRef(ref)    { globalThis.recentRefs.set(ref, Date.now()); }
function getBlacklist(){ purgeOld(); return [...globalThis.recentRefs.keys()]; }

/* ─── handler ─── */
export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) return jsonErr('Digite algo 🙏', 400);

    const blacklist = getBlacklist();

    const makePrompt = (avoid = []) => `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Selecione um trecho do Novo Testamento (1–3 versículos) que ofereça acolhimento e orientação.
2. Não use estes, pois foram usados recentemente: ${avoid.length ? avoid.join('; ') : '—'}.

Escreva dois parágrafos:
• Contexto Bíblico (≤120 palavras)  
• Aplicação Pessoal (≤120 palavras)  

**RETORNE EXATAMENTE ESTE JSON** (sem texto adicional):
{
  "reference": "Livro Cap:Vers[-Vers]",
  "passage": "Texto completo do trecho",
  "context": "…",
  "application": "…"
}
`.trim();

    const MAX_RETRIES = 3;
    let payload;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const comp = await openai.chat.completions.create({
        model: MODEL_ID,
        temperature: 0.7,
        max_tokens: 850,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.'
          },
          {
            role: 'user',
            content: makePrompt(blacklist)
          }
        ]
      });

      // conteúdo já vem como objeto JSON
      payload = comp.choices?.[0]?.message?.content;
      const { reference } = payload || {};
      if (reference && !blacklist.includes(reference)) {
        addRef(reference);
        break;
      }
      // tentar de novo se repetido ou ausente
      blacklist.push((payload?.reference) || `retry-${i}`);
      payload = null;
    }

    if (!payload?.reference) {
      return jsonErr('Não foi possível obter um trecho novo.', 502);
    }

    return Response.json(payload);

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return jsonErr('⚠️ Problema interno. Tente novamente.', 500);
  }
};

/* ─── util ─── */
function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
