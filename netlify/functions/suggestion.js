// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.6.0, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* cache simples em memória */
const KEEP_DAYS = 3;
globalThis.recentRefs = globalThis.recentRefs || new Map();
function purgeOld() {
  const ttl = KEEP_DAYS * 86_400_000, now = Date.now();
  for (const [r,t] of globalThis.recentRefs) if (now - t > ttl) globalThis.recentRefs.delete(r);
}
function addRef(r)    { globalThis.recentRefs.set(r, Date.now()); }
function getBlacklist(){ purgeOld(); return [...globalThis.recentRefs.keys()]; }

/* handler */
export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) return jsonErr('Digite algo 🙏',400);

    const blacklist = getBlacklist();
    const makePrompt = (avoid=[]) => `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Escolha um trecho do Novo Testamento (1–3 versículos consecutivos) que ofereça acolhimento e orientação.
2. Escreva DOIS parágrafos:
   • Contexto Bíblico (≤120 palavras)
   • Aplicação Pessoal (≤120 palavras)
`;

    const functionDef = [{
      name: 'outputVerse',
      description: 'Retorna a passagem e reflexões em JSON',
      parameters: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'Livro Cap:Vers[-Vers]' },
          passage:   { type: 'string', description: 'Texto completo do trecho' },
          context:   { type: 'string', description: 'Contexto Bíblico' },
          application:{ type: 'string', description: 'Aplicação Pessoal' },
        },
        required: ['reference','passage','context','application']
      }
    }];

    let payload;
    for (let i=0;i<3;i++) {
      const res = await openai.chat.completions.create({
        model: MODEL_ID,
        temperature: 0.0,        // zero para máxima consistência
        max_tokens: 850,
        messages: [
          { role:'system', content:'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
          { role:'user',   content: makePrompt(blacklist) }
        ],
        functions: functionDef,
        function_call: { name: 'outputVerse' }
      });

      const call = res.choices[0].message.function_call;
      if (!call?.arguments) continue;
      payload = JSON.parse(call.arguments);

      if (payload.reference && !blacklist.includes(payload.reference)) {
        addRef(payload.reference);
        break;
      }
    }

    if (!payload?.reference) {
      return jsonErr('Não foi possível obter um trecho novo.',502);
    }

    return Response.json(payload);

  } catch(err) {
    console.error('[GodCares] Erro:', err);
    return jsonErr('⚠️ Problema interno. Tente novamente.',500);
  }
};

/* util */
function jsonErr(msg,status=400){
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
