// netlify/functions/suggestion.js
// GodCares ✝️ — Palavra e Reflexão Profunda com Bible-API (v2.7.0, 2025-05-13)

import OpenAI from 'openai';

const {
  OPENAI_API_KEY,
  BIBLE_API_URL = 'https://bible-api.com'
} = process.env;

if (!OPENAI_API_KEY) {
  console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Busca o texto da passagem na Bible-API
 * @param {string} ref – ex: "João 14:1-3"
 * @returns {Promise<string>}
 */
async function fetchPassage(ref) {
  const url = `${BIBLE_API_URL}/${encodeURIComponent(ref)}?translation=almeida`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Passagem não encontrada: ${ref}`);
  }
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

    // 1) GPT-3.5: escolhe só a referência bíblica
    const refRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens: 30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        {
          role: 'user',
          content: `
O usuário compartilhou: "${entryText}"

TAREFA:
- Escolha **apenas** a referência de 1–3 versículos do Novo Testamento (ex: João 14:1-3).
- Responda **somente** com essa referência, sem texto adicional.
`.trim()
        }
      ]
    });

    const reference = refRes.choices?.[0]?.message?.content.trim();
    if (!reference) {
      throw new Error('Não foi possível obter a referência.');
    }

    // 2) Busca o texto real da Bíblia
    let passage;
    try {
      passage = await fetchPassage(reference);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Não encontrei a passagem "${reference}".` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3) GPT-4o: gera contexto e aplicação usando o texto real
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
1. Explique o *Contexto Bíblico* em até 120 palavras.
2. Explique a *Aplicação Pessoal* em até 120 palavras.

**RESPONDA EXATAMENTE ESTE JSON** (sem texto adicional):
{
  "reference": "${reference}",
  "context":   "…",
  "application":"…"
}
`.trim()
        }
      ]
    });

    const payload = JSON.parse(reflectRes.choices[0].message.content);
    return new Response(JSON.stringify(payload), {
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
