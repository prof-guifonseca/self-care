// netlify/functions/suggestion.js
// GodCares ✝️ — Palavra e Reflexão Profunda (v2.9.3, 2025-05-14)

import OpenAI from 'openai';

const { OPENAI_API_KEY } = process.env;
if (!OPENAI_API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export default async function handler(event) {
  try {
    // parse do body Netlify
    const { entryText } = JSON.parse(event.body || '{}');
    if (!entryText?.trim()) {
      return new Response(JSON.stringify({ error: 'Digite algo para receber a Palavra.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) GPT-3.5: obtenha apenas a referência
    const refRes = await openai.chat.completions.create({
      model:       'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens:  30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        { role: 'user', content: `
O usuário compartilhou: "${entryText}"

TAREFA:
- Responda SOMENTE com a referência de 1–3 versículos do Novo Testamento (ex: Filipenses 4:4).
        `.trim() }
      ]
    });
    const reference = refRes.choices[0].message.content.trim();
    if (!reference) throw new Error('Sem referência');

    // 2) GPT-4o: gere contexto e aplicação e inclua a referência no JSON de saída
    const reflectRes = await openai.chat.completions.create({
      model:       'gpt-4o-2024-05-13',
      temperature: 0.7,
      max_tokens:  600,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
        { role: 'user', content: `
Aqui está a referência bíblica: ${reference}

TAREFA:
1. Contexto Bíblico (até 120 palavras).
2. Aplicação Pessoal (até 120 palavras).

**RETORNE EXATAMENTE ESTE OBJETO JSON** (sem texto adicional):
{
  "verse": "${reference}",
  "context":   "…",
  "application":"…"
}
        `.trim() }
      ]
    });

    const { verse, context, application } = JSON.parse(reflectRes.choices[0].message.content);

    return new Response(JSON.stringify({ verse, context, application }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível gerar a Palavra. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' })
    );
  }
}
