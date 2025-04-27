export default async (req, ctx) => {
    try {
      const r = await fetch('https://stoicismquote.com/api/v1/quotes/random');
      if (!r.ok) throw 'stoic fail';
      const { quote, author } = await r.json();
      return new Response(JSON.stringify({ q: quote, a: author }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (_) {
      const r = await fetch('https://zenquotes.io/api/random');
      const [data] = await r.json();
      return new Response(JSON.stringify({ q: data.q, a: data.a }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };