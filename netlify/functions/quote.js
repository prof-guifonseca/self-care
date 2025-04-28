/* netlify/functions/quote.js
   Busca citação com cache em memória + fallback integrado
*/

const cache = []; // Armazena citações já recebidas

export default async (req, ctx) => {
  try {
    /* Se já existem citações no cache, entrega aleatoriamente */
    if (cache.length > 0) {
      const random = cache[Math.floor(Math.random() * cache.length)];
      return new Response(JSON.stringify(random), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    /* Senão, busca do stoicismquote */
    const r = await fetch('https://stoicismquote.com/api/v1/quotes/random');
    if (!r.ok) throw new Error('Stoicism API falhou');
    
    const { quote, author } = await r.json();
    const newQuote = { q: quote, a: author };
    
    cache.push(newQuote); // Guarda no cache

    return new Response(JSON.stringify(newQuote), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (_) {
    /* Se falhar, busca do ZenQuotes */
    try {
      const r = await fetch('https://zenquotes.io/api/random');
      const [data] = await r.json();
      const fallbackQuote = { q: data.q, a: data.a };
      
      cache.push(fallbackQuote); // Guarda fallback no cache também

      return new Response(JSON.stringify(fallbackQuote), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      /* Se tudo falhar, devolve uma mensagem padrão */
      return new Response(JSON.stringify({
        q: 'Em tempos difíceis, persista.',
        a: 'SelfCare App'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
  }
};
