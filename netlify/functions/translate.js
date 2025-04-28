/* netlify/functions/translate.js
   Proxy EN → PT com cache em memória
   Entrada : { "text": "Hello" }
   Saída   : { "translatedText": "Olá" }
*/

const cache = new Map(); // Cache simples em memória

export default async (req, ctx) => {
  try {
    const { text = '' } = await req.json();
    if (!text.trim()) throw new Error('Texto vazio');

    /* Se já existe no cache, retorna imediatamente */
    if (cache.has(text)) {
      return new Response(
        JSON.stringify({ translatedText: cache.get(text) }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    /* Consulta à API externa */
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'pt',
        format: 'text'
      })
    });

    if (!response.ok) throw new Error('LibreTranslate falhou');

    const { translatedText } = await response.json();

    /* Guarda no cache */
    cache.set(text, translatedText);

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('translate error:', err);
    return new Response(
      JSON.stringify({ translatedText: text }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  }
};
