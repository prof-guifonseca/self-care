// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.1.1, 2025-04-28)

import OpenAI from 'openai';

// Captura segura da API Key
const API_KEY = process.env.OPENAI_API_KEY || '';

if (!API_KEY) {
  console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');
}

const openai = new OpenAI({ apiKey: API_KEY });

export default async (req, ctx) => {
  try {
    const { entryText } = await req.json();

    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Texto vazio. Por favor, escreva algo para receber uma Palavra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prompt estruturado
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

    // Requisição à OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      timeout: 15000,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim() || '';

    // Extração dos dados
    const verseMatch = responseText.match(/Versículo:\s*(.+)/i);
    const contextMatch = responseText.match(/Contexto:\s*([\s\S]+?)Aplicação:/i);
    const applicationMatch = responseText.match(/Aplicação:\s*(.+)/i);

    const verse = verseMatch ? verseMatch[1].trim() : '⚠️ Versículo não encontrado.';
    const context = contextMatch ? contextMatch[1].trim() : '⚠️ Contexto não encontrado.';
    const application = applicationMatch ? applicationMatch[1].trim() : '⚠️ Aplicação não encontrada.';

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
