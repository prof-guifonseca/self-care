/* netlify/functions/sentiment.js
   ---------------------------------------------------------
   Análise de sentimento via HuggingFace Inference API
   Entrada : { "text": "sua frase aqui" }
   Saída   : [ { label: "POSITIVE"|"NEGATIVE"|"NEUTRAL", score: 0.98 } ]
*/

const HF_MODEL = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

const cache = new Map(); // Cache de análises recentes

export default async (req, ctx) => {
  try {
    const { text = '' } = await req.json();
    const cleanedText = text.trim();
    if (!cleanedText) {
      return new Response(
        JSON.stringify([{ label: 'NEUTRAL', score: 0 }]),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    /* Busca no cache primeiro */
    if (cache.has(cleanedText)) {
      return new Response(
        JSON.stringify([cache.get(cleanedText)]),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    /* Chamada à API Hugging Face */
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({ inputs: cleanedText }),
    });

    if (!response.ok) throw new Error('Hugging Face API falhou');

    const apiData = await response.json();
    const best = Array.isArray(apiData) && apiData[0]
      ? apiData[0].reduce((max, cur) => (cur.score > max.score ? cur : max))
      : { label: 'NEUTRAL', score: 0 };

    /* Guarda no cache */
    cache.set(cleanedText, { label: best.label, score: best.score });

    return new Response(
      JSON.stringify([{ label: best.label, score: best.score }]),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Erro na análise de sentimento:', err);
    return new Response(
      JSON.stringify([{ label: 'NEUTRAL', score: 0 }]),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  }
};
