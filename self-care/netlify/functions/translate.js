/* netlify/functions/translate.js
   Proxy para traduzir EN → PT sem problemas de CORS
   Entrada : { "text": "Hello" }
   Saída   : { translatedText: "Olá" }
*/
export default async (req, ctx) => {
    try {
      const { text = '' } = await req.json();
      if (!text.trim()) throw new Error('Texto vazio');
  
      const r = await fetch('https://libretranslate.de/translate', {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ q: text, source:'en', target:'pt', format:'text' })
      });
      if (!r.ok) throw new Error('LibreTranslate falhou');
  
      const { translatedText } = await r.json();
      return new Response(JSON.stringify({ translatedText }), {
        headers: { 'Content-Type':'application/json' }
      });
  
    } catch (err) {
      /* fallback: devolve texto original para não travar o app */
      console.error('translate error:', err);
      return new Response(JSON.stringify({ translatedText: text }), {
        headers: { 'Content-Type':'application/json' },
        status: 200
      });
    }
  };  