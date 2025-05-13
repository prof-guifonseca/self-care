// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.6.1, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';

if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

/* ─── Handler ─── */
export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Digite algo para receber a Palavra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Definição da função para o modelo chamar
    const functionDef = [
      {
        name: 'outputVerse',
        description: 'Retorna um trecho bíblico e reflexões em JSON',
        parameters: {
          type: 'object',
          properties: {
            reference:   { type: 'string', description: 'Livro Cap:Vers[-Vers]' },
            passage:     { type: 'string', description: 'Texto completo do trecho' },
            context:     { type: 'string', description: 'Contexto Bíblico' },
            application: { type: 'string', description: 'Aplicação Pessoal' }
          },
          required: ['reference','passage','context','application']
        }
      }
    ];

    // Mensagens ao modelo
    const messages = [
      {
        role: 'system',
        content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.'
      },
      {
        role: 'user',
        content: `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Escolha 1–3 versículos do Novo Testamento que tragam acolhimento e orientação.
2. Escreva
   • Contexto Bíblico (≤120 palavras)
   • Aplicação Pessoal (≤120 palavras)

**RETORNE EXATAMENTE ESTE JSON**:
{
  "reference": "Livro Cap:Vers[-Vers]",
  "passage":   "Texto completo do trecho",
  "context":   "…",
  "application":"…"
}`
      }
    ];

    // Chamada com Function Calling
    const { choices } = await openai.chat.completions.create({
      model:          MODEL_ID,
      temperature:    0.0,
      max_tokens:     800,
      messages,
      functions:      functionDef,
      function_call:  { name: 'outputVerse' }
    });

    const fnCall = choices[0].message.function_call;
    if (!fnCall?.arguments) {
      throw new Error('Modelo não retornou function_call');
    }

    // Parse seguro do JSON retornado
    let payload;
    try {
      payload = JSON.parse(fnCall.arguments);
    } catch {
      throw new Error('Erro ao parsear JSON do modelo');
    }

    // Retorna o objeto diretamente
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível gerar a Palavra. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
