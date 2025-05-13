import OpenAI from 'openai';

const { OPENAI_API_KEY, BIBLE_API_URL = 'https://bible-api.com' } = process.env;
if (!OPENAI_API_KEY) console.error('[GodCares] ⚠️ OPENAI_API_KEY não configurada.');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function fetchPassage(ref) {
  const url = `${BIBLE_API_URL}/${encodeURIComponent(ref)}?translation=almeida`;
  const r   = await fetch(url);
  if (!r.ok) throw new Error(`Passagem não encontrada: ${ref}`);
  const { text } = await r.json();
  return text.trim();
}

export default async (event) => {
  try {
    const { entryText } = await event.json();
    if (!entryText?.trim()) {
      return new Response(JSON.stringify({ error: 'Digite algo para receber a Palavra.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1) GPT-3.5 só para escolher a referência
    const refRes = await openai.chat.completions.create({
      model:       'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens:  30,
      messages: [
        { role: 'system', content: 'Você é um conselheiro pastoral evangélico.' },
        { role: 'user', content: `
O usuário compartilhou: "${entryText}"

TAREFA:
- Escolha apenas a referência de 1–3 versículos do Novo Testamento (ex: Filipenses 4:4).
- Responda SOMENTE com essa referência.
`.trim() }
      ]
    });

    const reference = refRes.choices[0].message.content.trim();
    if (!reference) throw new Error('Sem referência');

    // 2) Busco o texto real na Bible-API
    const passage = await fetchPassage(reference);

    // 3) GPT-4o para gerar só context e application
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
1. Contexto Bíblico (até 120 palavras).
2. Aplicação Pessoal (até 120 palavras).

**RESPONDA EM JSON** (somente o objeto, sem texto extra):
{
  "context":   "…",
  "application":"…"
}
`.trim() }
      ]
    });

    // 4) Montar o JSON final no código
    const out = JSON.parse(reflectRes.choices[0].message.content);
    const result = {
      reference,
      passage,
      context:     out.context.trim(),
      application: out.application.trim()
    };

    return new Response(JSON.stringify(result), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[GodCares] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível gerar a Palavra. Tente novamente.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' })
    );
  }
};
