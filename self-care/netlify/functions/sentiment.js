/* netlify/functions/sentiment.js
   ---------------------------------------------------------
   Entrada : { "text": "sua frase aqui" }
   Saída   : [ { label: "POSITIVE"|"NEGATIVE"|"NEUTRAL", score: 0.98 } ]
*/

export default async (req, ctx) => {
    try {
      /* 1. Texto recebido do front */
      const { text = '' } = await req.json();
      if (!text.trim()) throw new Error('Texto vazio');
  
      /* 2. Chamada à Hugging Face Inference API */
      const HF_MODEL = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';
      const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  
      const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;     // opcional
      const res = await fetch(HF_URL, {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` })
        },
        body: JSON.stringify({ inputs: text })
      });
  
      if (!res.ok) throw new Error('Hugging Face API fail');
  
      /* 3. Normaliza resposta: pegue a classe com maior score */
      const apiData = await res.json();                // [[{label,score}]]
      const best = Array.isArray(apiData) && apiData[0]
        ? apiData[0].reduce((max, cur) => cur.score > max.score ? cur : max)
        : { label: 'NEUTRAL', score: 0 };
  
      return new Response(
        JSON.stringify([ { label: best.label, score: best.score } ]),
        { headers: { 'Content-Type': 'application/json' } }
      );
  
    } catch (err) {
      /* Fallback neutro para não quebrar o front */
      console.error('sentiment error:', err);
      return new Response(
        JSON.stringify([ { label: 'NEUTRAL', score: 0 } ]),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  };  