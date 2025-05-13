// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.3.0, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o';

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* =========================================================================
   Mini-“KV” em memória (troque por KV real se quiser persistência cross-edge)
   =========================================================================*/

/** @type {number} */
const KEEP_DAYS = 3;

/** @type {Map<string, number>} */
globalThis.recentVerses = globalThis.recentVerses || new Map();

function purgeOld() {
  const now = Date.now();
  const ttl = KEEP_DAYS * 24 * 60 * 60 * 1000;
  for (const [v, t] of globalThis.recentVerses) {
    if (now - t > ttl) globalThis.recentVerses.delete(v);
  }
}

/** @param {string} v */
function addVerse(v) {
  globalThis.recentVerses.set(v, Date.now());
}

/** @returns {string[]} */
function getBlacklist() {
  purgeOld();
  return [...globalThis.recentVerses.keys()];
}

/* ========================================================================= */

export default async (req, ctx) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) {
      return jsonErr(
        'Texto vazio. Por favor, escreva algo para receber uma Palavra.',
        400,
      );
    }

    // ---------- blacklist ----------
    const blacklist = getBlacklist(); // ex.: ["Salmos 37:5", "Mateus 5:4"]

    // ---------- prompt ----------
    /** @param {string[]} avoidList */
    const makePrompt = (avoidList) => `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Escolha um único versículo bíblico (NVI) que acolha e oriente essa situação.
2. **Não** use nenhum destes, pois foram usados recentemente: ${
      avoidList.length ? avoidList.join('; ') : '—'
    }
3. Escreva dois parágrafos:
   • Contexto Bíblico (≤120 palavras).
   • Aplicação Pessoal  (≤120 palavras).
4. Formato exato:

Versículo: "Texto" (Livro Cap:Vers)

Contexto: …

Aplicação: …
`.trim();

    let responseText = '';
    let verse = '';
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const completion = await openai.chat.completions.create({
        model: MODEL_ID,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content:
              'Você é um conselheiro pastoral evangélico de estilo acolhedor.',
          },
          {
            role: 'assistant',
            content:
              'Diretrizes internas: siga o formato exato, parágrafos ≤120 palavras.',
          },
          { role: 'user', content: makePrompt(blacklist) },
        ],
      });

      responseText =
        completion.choices?.[0]?.message?.content?.trim() || '';

      const match = responseText.match(
        /Versículo:\s*".*"\s*\(([^)]+)\)/i,
      );
      verse = match ? match[1].trim() : '';

      if (!verse || blacklist.includes(verse)) {
        // Repetido → adiciona à blacklist temporária e tenta de novo
        blacklist.push(verse || `attempt-${attempt}`);
        continue;
      }
      break; // sucesso
    }

    if (!verse) {
      return jsonErr('Não foi possível obter um versículo novo.', 502);
    }

    // Salva no “cache”
    addVerse(verse);
    // Se usar KV real: ctx.waitUntil(KV.put(verse, Date.now().toString()))

    // Parseia contexto / aplicação
    const context =
      (/Contexto:\s*([\s\S]+?)Aplicação:/i.exec(responseText)?.[1] || '')
        .trim();
    const application =
      (/Aplicação:\s*([\s\S]+)$/i.exec(responseText)?.[1] || '').trim();

    return Response.json({ verse, context, application });
  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return jsonErr(
      '⚠️ Não foi possível gerar a Palavra. Tente novamente em alguns minutos.',
      500,
    );
  }
};

// ---------- helper ----------
/**
 * @param {string} msg
 * @param {number} status
 */
function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
