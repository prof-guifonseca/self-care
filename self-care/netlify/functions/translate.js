/* netlify/functions/translate.js
   Proxy EN → PT para evitar CORS e reduzir latência
   Entrada : { "text": "Hello" }
   Saída   : { "translatedText": "Olá" }
*/
export default async (req, ctx) => {
  try {
    /* 1. Texto recebido do front */
    const { text = '' } = await req.json();
    if (!text.trim()) throw new Error('Texto vazio');

    /* 2. Chamada ao LibreTranslate (instância pública) */
    const r = await fetch('https://libretranslate.de/translate', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        q      : text,     // texto original
        source : 'en',
        target : 'pt',
        format : 'text'
      })
    });
    if (!r.ok) throw new Error('LibreTranslate falhou');

    /* 3. Resposta */
    const { translatedText } = await r.json();
    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    /* Fallback: devolve o texto original para não quebrar o app */
    console.error('translate error:', err);
    return new Response(
      JSON.stringify({ translatedText: text }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  }
};
