// netlify/functions/suggestion.js
// GodCares ✝️ — Palavra e Reflexão Profunda (v2.9.4, 2025-05-14)

const { default: OpenAI } = require('openai');

const { OPENAI_API_KEY, BIBLE_API_URL = 'https://bible-api.com' } = process.env;
if (!OPENAI_API_KEY) {
  console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchPassage(ref) {
  const url = `${BIBLE_API_URL}/${encodeURIComponent(ref)}?translation=almeida`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Passagem não encontrada: ${ref}`);
  const { text } = await res.json();
  return text.trim();
}

exports.handler = async function (event, context) {
  try {
    // parse do body Netlify (Lambda) ou Edge
    let body;
    if (event.body) {
      body = JSON.parse(event.body);
    } else {
      // fallback, caso Netlify mude o formato
      body = {};
    }
    const entryText = body.entryText;

    if (!entryText || !entryText.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Digite algo para receber a Palavra.' })
      };
    }

    // 1) GPT-3.5: obtenha só a referência
    const refRes = await openai.chat.completions.create({
      model:       'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens:  30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        { role: 'user', content: `
O usuário compartilhou: "${entryText}"

TAREFA:
- Responda apenas com a referência de 1–3 versículos do Novo Testamento (ex: Filipenses 4:4).
`.trim() }
      ]
    });

    const reference = refRes.choices[0].message.content.trim();
    if (!reference) throw new Error('Sem referência');

    // 2) Busca o texto real na Bible-API
    const passage = await fetchPassage(reference);

    // 3) GPT-4o: contexto e aplicação
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
1. Contexto Bíblico (até 120 palavras)
2. Aplicação Pessoal (até 120 palavras)

**RESPONDA EXATAMENTE ESTE JSON**:
{
  "verse": "${reference}",
  "context":   "…",
  "application":"…"
}
`.trim() }
      ]
    });

    const { verse, context: ctx, application } = JSON.parse(reflectRes.choices[0].message.content);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse, context: ctx, application })
    };

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Não foi possível gerar a Palavra. Tente novamente.' })
    };
  }
};
