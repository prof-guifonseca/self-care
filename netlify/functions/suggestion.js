// netlify/functions/suggestion.js
// GodCares ✝️ — Palavra e Reflexão Profunda com Bible-API (v2.8.0, 2025-05-13)

import OpenAI from 'openai';

const {
  OPENAI_API_KEY,
  BIBLE_API_URL = 'https://bible-api.com'
} = process.env;

if (!OPENAI_API_KEY) {
  console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchPassage(ref) {
  const url = `${BIBLE_API_URL}/${encodeURIComponent(ref)}?translation=almeida`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Passagem não encontrada: ${ref}`);
  const data = await res.json();
  return data.text.trim();
}

export default async (event) => {
  try {
    const { entryText } = await event.json();
    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Por favor, digite algo para receber a Palavra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) Pega só a referência (João 14:1-3)
    const refRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens: 30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        {
          role: 'user',
          content: `
O usuário disse: "${entryText}"

TAREFA:
- Escolha **apenas** a referência de 1–3 versículos do Novo Testamento (ex: João 14:1-3).
- Responda **somente** com essa referência, sem nada mais.
`.trim()
        }
      ]
    });
    const reference = refRes.choices?.[0]?.message?.content.trim();
    if (!reference) throw new Error('Não consegui a referência.');

    // 2) Busca o texto real na Bible-API
    let passage;
    try {
      passage = await fetchPassage(reference);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Não encontrei a passagem "${reference}".` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3) Gera Contexto e Aplicação com o texto real
    const reflectRes = await openai.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
        {
          role: 'user',
          content: `
Aqui está o texto (NVI):

"${passage}"

TAREFA:
1. Contexto Bíblico (≤120 palavras)
2. Aplicação Pessoal (≤120 palavras)

**RESPONDA APENAS ESTE JSON**:
{
  "context":   "…",
  "application":"…"
}
`.trim()
        }
      ]
    });

    const { context, application } = JSON.parse(reflectRes.choices[0].message.content);

    // 4) Monta o objeto final incluindo passage
    const result = { reference, passage, context, application };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return new Response(
      JSON.stringify({ error: '⚠️ Não foi possível gerar a Palavra. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
