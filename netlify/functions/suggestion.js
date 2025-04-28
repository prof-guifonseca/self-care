// netlify/functions/selfcare-suggestion.js
// Gera sugestão de autocuidado com OpenAI baseado no humor detectado

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async (req, ctx) => {
  try {
    // Validação básica do corpo da requisição
    const { mood, entryText, sentiment } = await req.json();
    if (!entryText || !sentiment?.label || sentiment?.score == null) {
      return new Response(
        JSON.stringify({ error: 'Dados insuficientes para gerar sugestão.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Geração do prompt de forma natural e envolvente
    const prompt = `
O usuário relatou: "${entryText}"
Humor detectado: ${sentiment.label} (confiança: ${(sentiment.score * 100).toFixed(1)}%).
Em português, gere uma única resposta que:
- Comece com uma mini-frase de acolhimento (tipo um mantra),
- Em seguida, ofereça uma dica prática de autocuidado para esse estado emocional.
Seja leve, gentil e inspirador, mas direto ao ponto.
    `.trim();

    // Chamada à OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 150, // Limite de resposta para ser conciso
      timeout: 10000,  // Timeout de segurança de 10s
    });

    // Resposta bem-formatada
    const suggestion = completion.choices?.[0]?.message?.content?.trim() || '';

    if (!suggestion) {
      throw new Error('Falha ao gerar sugestão.');
    }

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Erro no selfcare-suggestion:', err);

    return new Response(
      JSON.stringify({ error: 'Não foi possível gerar uma sugestão no momento.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
