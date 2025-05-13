// netlify/functions/suggestion.js
// GodCares ✝️ — Palavra e Reflexão Profunda com Bible-API (v2.8.1, 2025-05-13)

import OpenAI from 'openai';

const {
  OPENAI_API_KEY,
  BIBLE_API_URL = 'https://bible-api.com'
} = process.env;

if (!OPENAI_API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchPassage(ref) {
  const url = `${BIBLE_API_URL}/${encodeURIComponent(ref)}?translation=almeida`;
  const r   = await fetch(url);
  if (!r.ok) throw new Error(`Passagem não encontrada: ${ref}`);
  const { text } = await r.json();
  return text.trim();
}

export default async (event) => {
  try {
    const { entryText } = await event.json();
    if (!entryText?.trim()) {
      return new Response(JSON.stringify({ error: 'Digite algo para receber a Palavra.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) GPT-3.5 escolhe só a referência
    const refRes = await openai.chat.completions.create({
      model:       'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens:  30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        { role: 'user', content: `
O usuário compartilhou: "${entryText}"

TAREFA:
- Escolha apenas a referência de 1–3 versículos do Novo Testamento (ex: Filipenses 4:4).
- Responda SOMENTE com essa referência.
`.trim() }
      ]
    });

    const reference = refRes.choices[0].message.content.trim();
    if (!reference) throw new Error('Sem referência');

    // 2) Busca o texto real
    const passage = await fetchPassage(reference);

    // 3) GPT-4o gera contexto e aplicação
    const reflectRes = await openai.chat.completions.create({
      model:       'gpt-4o-2024-05-13',
      temperature: 0.7,
      max_tokens:  600,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
        { role: 'user', content: `
Aqui está o texto (NVI):

"${passage}"

TAREFA:
1. Contexto Bíblico (≤120 palavras)
2. Aplicação Pessoal (≤120 palavras)

**RESPONDA APENAS ESTE JSON**:
{
  "reference": "${reference}",
  "passage":   "${passage.replace(/\n/g,' ')}",
  "context":   "…",
  "application":"…"
}
`.trim() }
      ]
    });

    const json = JSON.parse(reflectRes.choices[0].message.content);
    return new Response(JSON.stringify(json), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return new Response(JSON.stringify({ error: 'Não foi possível gerar a Palavra.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
