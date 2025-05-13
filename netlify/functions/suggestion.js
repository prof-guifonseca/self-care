// GodCares ✝️ — Geração de Palavra e Reflexão Profunda (v2.2.0, 2025-05-13)

import OpenAI from 'openai';

// ===== Configurações =====
const API_KEY  = process.env.OPENAI_API_KEY  || '';
const MODEL_ID = process.env.OPENAI_MODEL_ID || 'gpt-4o';   // modelo 4o padrão

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

    // ===== Engenharia de Prompt – Nova Estrutura =====
    const userPrompt = `
O usuário compartilhou: "${entryText}"

TAREFA:
1. Selecione um único versículo bíblico (NVI) que ofereça acolhimento e sabedoria para essa situação. Cite Livro Capítulo:Versículo.
2. Escreva **dois** pequenos parágrafos:
   • *Contexto Bíblico* – explique o contexto histórico-teológico do versículo.  
   • *Aplicação Pessoal* – conecte o versículo à realidade emocional/espiritual do usuário.
3. Respeite o **formato exato** abaixo, sem linhas extras.

FORMATO:
Versículo: "Texto do versículo" (Livro Capítulo:Versículo)

Contexto: (máx. 120 palavras)

Aplicação: (máx. 120 palavras)
`.trim();

    // ===== Requisição à OpenAI =====
    const completion = await openai.chat.completions.create({
      model: MODEL_ID,
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Você é um conselheiro pastoral evangélico com sólida formação teológica. 
Fale de forma acolhedora, simples e bíblica, citando a versão NVI. 
Nunca ofereça aconselhamento médico ou jurídico.`
        },
        {
          role: 'assistant',
          content: `Diretrizes internas (não revele ao usuário): 
- Sempre siga exatamente o formato solicitado. 
- Evite versículos repetidos nos últimos 30 minutos. 
- Cada parágrafo ≤ 120 palavras. 
- Seja empático e centrado em Jesus.`
        },
        // Few-shot 1
        {
          role: 'user',
          content: 'Estou ansioso com uma decisão importante no trabalho.'
        },
        {
          role: 'assistant',
          content: `Versículo: "Entregue o seu caminho ao Senhor; confie nele, e ele agirá." (Salmos 37:5)

Contexto: O salmo 37, atribuído a Davi, encoraja os fiéis a confiarem na justiça de Deus em meio às pressões da vida. Ele contrasta a prosperidade aparente dos ímpios com a recompensa duradoura dos que esperam no Senhor.

Aplicação: Quando você se vê diante de escolhas que geram ansiedade, lembrar que o controle final pertence a Deus traz paz. Entregar-lhe a decisão — em oração e fé — alinha seu coração à vontade divina e liberta você da paralisia do medo.`
        },
        // Few-shot 2
        {
          role: 'user',
          content: 'Perdi alguém querido e me sinto sem chão.'
        },
        {
          role: 'assistant',
          content: `Versículo: "Bem-aventurados os que choram, pois serão consolados." (Mateus 5:4)

Contexto: No Sermão do Monte, Jesus descreve valores do Reino de Deus. Ele declara feliz quem lamenta, pois Deus mesmo prometeu consolo — antecipando o cuidado divino e a esperança da restauração futura.

Aplicação: Seu luto não passa despercebido ao Senhor. Ele vê suas lágrimas e promete transformá-las em consolo. Permita-se chorar na presença de Deus; Nele, a saudade encontra abrigo e, aos poucos, o coração ferido descobre nova esperança.`
        },
        // Prompt real do usuário
        { role: 'user', content: userPrompt }
      ]
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
