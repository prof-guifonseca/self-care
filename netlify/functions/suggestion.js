// netlify/functions/suggestion.js
// SelfCare ✝️ — Gera Palavra Bíblica + Reflexão via OpenAI

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async (req, ctx) => {
  try {
    // Lê o texto do usuário
    const { entryText } = await req.json();
    if (!entryText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Texto vazio.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Novo prompt para gerar Palavra Bíblica personalizada
    const prompt = `
O usuário compartilhou o seguinte sentimento ou reflexão: "${entryText}"

Com base na Bíblia Sagrada:
1. Escolha um versículo que melhor acolha essa situação (cite o livro, capítulo e versículo).
2. Depois, escreva uma breve reflexão inspiradora em português, com no máximo 3 linhas, baseada nesse versículo.

Formato da resposta:
Versículo: "Texto do versículo" (Livro Capítulo:Versículo)
Reflexão: Texto da reflexão
`.trim();

    // Chamada à OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      timeout: 10000,
    });

    const responseText = completion.choices?.[0]?.message?.content?.trim() || '';

    // Processa a resposta recebida (esperando os campos Versículo e Reflexão)
    const verseMatch = responseText.match(/Versículo:\s*(.+)/i);
    const reflectionMatch = responseText.match(/Reflexão:\s*(.+)/i);

    const verse = verseMatch ? verseMatch[1].trim() : 'Versículo não encontrado.';
    const reflection = reflectionMatch ? reflectionMatch[1].trim() : 'Reflexão não encontrada.';

    return new Response(
      JSON.stringify({ verse, reflection }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Erro na geração da Palavra:', err);
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar Palavra. Tente novamente mais tarde.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
