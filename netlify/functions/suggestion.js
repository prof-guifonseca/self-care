// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.1.2, 2025-05-13)

import OpenAI from 'openai';

// ===== Configurações =====
const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o';   // ⬅️ modelo 4o padrão

if (!API_KEY) {
  console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');
}

const openai = new OpenAI({ apiKey: API_KEY });

// ===== Função Principal =====
export default async (req, ctx) => {
  try {
    const { entryText } = await req.json();

    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Texto vazio. Por favor, escreva algo para receber uma Palavra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Chave de API ausente. Não é possível gerar a Palavra.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== Prompt estruturado =====
    const prompt = `
O usuário compartilhou: "${entryText}"

Com base na Bíblia Sagrada:
1. Selecione um versículo que traga acolhimento e sabedoria para essa situação (cite o Livro, Capítulo e Versículo).
2. Depois, escreva dois pequenos parágrafos de reflexão:
   - Contexto Bíblico: explique o contexto do versículo.
   - Aplicação Pessoal: conecte com a realidade emocional/espiritual da pessoa.

⚡ Formato esperado:
Versículo: "Texto do versículo" (Livro Capítulo:Versículo)

Contexto: (primeiro parágrafo)

Aplicação: (segundo parágrafo)
`.trim();

    // ===== Requisição à OpenAI =====
    const completion = await openai.chat.completions.create({
      model: MODEL_ID,             // ⬅️ agora usa 'gpt-4o' (ou valor da env OPENAI_MODEL_ID)
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim() || '';

    // ===== Extração segura =====
    const verseMatch       = responseText.match(/Versículo:\s*(.+)/i);
    const contextMatch     = responseText.match(/Contexto:\s*([\s\S]+?)Aplicação:/i);
    const applicationMatch = responseText.match(/Aplicação:\s*(.+)/i);

    const verse       = verseMatch      ? verseMatch[1].trim()       : '⚠️ Versículo não encontrado.';
    const context     = contextMatch    ? contextMatch[1].trim()     : '⚠️ Contexto não encontrado.';
    const application = applicationMatch? applicationMatch[1].trim() : '⚠️ Aplicação não encontrada.';

    // ===== Resposta formatada =====
    return new Response(
      JSON.stringify({ verse, context, application }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[GodCares] Erro crítico ao gerar Palavra:', err);
    return new Response(
      JSON.stringify({ error: '⚠️ Não foi possível gerar a Palavra. Tente novamente em alguns minutos.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
