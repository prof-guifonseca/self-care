// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.6.2, 2025-05-13)

import OpenAI from 'openai';

const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o-2024-05-13';
if (!API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: API_KEY });

export default async (req) => {
  try {
    const { entryText } = await req.json();
    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Digite algo para receber a Palavra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Função para o modelo chamar (opcional)
    const functionDef = [{
      name: 'outputVerse',
      description: 'Retorna um JSON com passagem e reflexões.',
      parameters: {
        type: 'object',
        properties: {
          reference:   { type: 'string' },
          passage:     { type: 'string' },
          context:     { type: 'string' },
          application: { type: 'string' }
        },
        required: ['reference','passage','context','application']
      }
    }];

    // Prompt principal
    const prompt = `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Varie a cada chamada: escolha **um trecho diferente** do Novo Testamento (1–3 versículos consecutivos).
2. Escreva dois parágrafos:
   • Contexto Bíblico (≤120 palavras)  
   • Aplicação Pessoal (≤120 palavras)

**RESPONDA JSON** (sem texto extra):
{
  "reference": "Livro Cap:Vers[-Vers]",
  "passage":   "Texto completo do trecho",
  "context":   "...",
  "application":"..."
}
`.trim();

    // Chama o modelo
    const res = await openai.chat.completions.create({
      model:         MODEL_ID,
      temperature:   0.7,              // mais variedade
      max_tokens:    850,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico, acolhedor e bíblico.' },
        { role: 'user',   content: prompt }
      ],
      functions:     functionDef,
      function_call: 'auto'             // permite JSON via função ou texto
    });

    const msg = res.choices[0].message;

    let payload;
    if (msg.function_call?.arguments) {
      // se a função foi chamada, parseie argumentos
      payload = JSON.parse(msg.function_call.arguments);
    } else if (msg.content) {
      // fallback: o modelo deixou o JSON no content
      payload = JSON.parse(msg.content);
    } else {
      throw new Error('Sem conteúdo ou function_call');
    }

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
