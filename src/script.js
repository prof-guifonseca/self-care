/* Self-Care – Core v0.9 (2025-04-27)
   • Citações (+ tradução) e dicas tagueadas
   • Sentimento remoto (fallback local)
   • 100 % offline com data/*.json
-------------------------------------------------------------------*/
(() => {
  'use strict';

  /* ======= Config ======= */
  const STORAGE       = { history: 'sc_history', notes: 'sc_notes', tcache: 'sc_translate' };
  const MAX_HISTORY   = 50;
  const DISPLAY_LIMIT = 7;
  const API           = {
    senti : '/api/sentiment',
    quote : '/api/quote',
    trans : '/api/translate'
  };

  /* ======= Datasets locais ======= */
  let quotes = {}, tips = {};
  fetch('data/quotes.json').then(r => r.ok && r.json()).then(j => (quotes = j || {}));
  fetch('data/selfcare-tips.json').then(r => r.ok && r.json()).then(j => (tips = j || {}));

  /* ======= Fallbacks ======= */
  const LOCAL_QUOTES = [
    { q: 'A felicidade da sua vida depende da qualidade dos seus pensamentos.', a: 'Marco Aurélio' },
    { q: 'Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.', a: 'Sêneca' },
    { q: 'Primeiro diga a si mesmo o que você seria; e depois faça o que tem de fazer.', a: 'Epicteto' }
  ];
  const FALLBACK_TIPS = {
    positive: ['Celebre algo bom de hoje ✨'],
    neutral : ['Alongue os ombros e respire fundo.'],
    negative: ['Faça 3 ciclos de respiração 4-7-8 e relaxe.']
  };

  /* ======= Análise local de sentimento ======= */
  const SentimentAnalyzer = typeof Sentiment !== 'undefined' ? new Sentiment() : null;

  /* ======= Helpers ======= */
  const rand   = arr => arr[Math.floor(Math.random() * arr.length)];
  const format = ts  => new Date(ts).toLocaleString('pt-BR', { weekday:'short', hour:'2-digit', minute:'2-digit' });
  const translateCache = JSON.parse(localStorage.getItem(STORAGE.tcache) || '{}');

  /* tags → tópico (para dicas) */
  const TOPICS = {
    stress: ['cansado','estressado','ansioso','sobrecarregado'],
    sleep : ['sono','dormir','insônia'],
    happy : ['feliz','grato','animado','orgulhoso'],
    social: ['sozinho','isolado','amigos','família']
  };
  const detectTopic = txt => Object.keys(TOPICS).find(k => TOPICS[k].some(w => txt.toLowerCase().includes(w)));

  /* ======= Tradução EN→PT com cache ======= */
  async function t(ptText) {                         // traduz / devolve do cache
    if (translateCache[ptText]) return translateCache[ptText];
    try {
      const r = await fetch(API.trans, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text: ptText }) });
      if (!r.ok) throw 0;
      const { translatedText } = await r.json();
      translateCache[ptText] = translatedText || ptText;
      localStorage.setItem(STORAGE.tcache, JSON.stringify(translateCache));
      return translateCache[ptText];
    } catch { return ptText; }
  }

  /* ======= Obter citação ======= */
  async function getQuote(label) {
    if (quotes[label]?.length) return rand(quotes[label]);
    try {
      const r = await fetch(API.quote);
      if (!r.ok) throw 0;
      const obj = await r.json();          // { q, a } EN
      obj.q = await t(obj.q);
      return obj;
    } catch { return rand(LOCAL_QUOTES); }
  }

  /* ======= Dica de autocuidado ======= */
  const getTip = label =>
    tips[label]?.length ? rand(tips[label]).tip : rand(FALLBACK_TIPS[label] || FALLBACK_TIPS.neutral);

  /* ======= Sentimento remoto + fallback ======= */
  async function score(text) {
    try {
      const r = await fetch(API.senti, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text }) });
      if (!r.ok) throw 0;
      const [{ label='NEUTRAL' }] = await r.json();
      return label === 'NEGATIVE' ? -1 : label === 'POSITIVE' ? 1 : 0;
    } catch {
      return SentimentAnalyzer ? SentimentAnalyzer.analyze(text).score : 0;
    }
  }

  /* ======= Histórico ======= */
  const saveMood = mood => {
    const h = JSON.parse(localStorage.getItem(STORAGE.history) || '[]');
    h.unshift({ mood, time: Date.now() });
    localStorage.setItem(STORAGE.history, JSON.stringify(h.slice(0, MAX_HISTORY)));
  };
  const renderHistory = () => {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.textContent = '';
    const h = JSON.parse(localStorage.getItem(STORAGE.history) || '[]');
    h.slice(0, DISPLAY_LIMIT).forEach(i => {
      list.insertAdjacentHTML('beforeend', `<li><span>${i.mood}</span><span>${format(i.time)}</span></li>`);
    });
    updateChart(h);
  };

  /* ======= Chart (opcional) ======= */
  let chart;
  const updateChart = history => {
    const cvs = document.getElementById('moodChart');
    if (!cvs || typeof Chart === 'undefined') return;
    const counts = {};
    history.forEach(({ mood }) => counts[mood] = (counts[mood] || 0) + 1);
    const labels = Object.keys(counts), data = labels.map(l => counts[l]);
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      return chart.update();
    }
    chart = new Chart(cvs.getContext('2d'), {
      type:'bar',
      data:{ labels, datasets:[{ data, borderWidth:0 }] },
      options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } }
    });
  };

  /* ======= Salvar nota & feedback automático ======= */
  async function handleNoteSave() {
    const textarea = document.getElementById('entry');
    const text = textarea.value.trim();
    if (!text) return;

    /* salva nota */
    const notes = JSON.parse(localStorage.getItem(STORAGE.notes) || '[]');
    notes.unshift({ text, time: Date.now() });
    localStorage.setItem(STORAGE.notes, JSON.stringify(notes.slice(0, 30)));

    /* análise */
    const sc   = await score(text);
    const tp   = detectTopic(text);
    const tag  = tp || (sc > 0 ? 'positive' : sc < 0 ? 'negative' : 'neutral');
    const { q, a } = await getQuote(tag);
    const tip  = getTip(tag);

    /* UI */
    document.getElementById('autoFeedback').textContent = tip;
    document.getElementById('autoFeedback').classList.remove('hidden');
    document.getElementById('quoteText').textContent   = `"${q}"`;
    document.getElementById('quoteAuthor').textContent = `— ${a}`;
    document.getElementById('quoteBox').classList.remove('hidden');

    /* humor deduzido */
    saveMood(sc > 0 ? '😃' : sc < 0 ? '🙁' : '😐');
    renderHistory();
    textarea.value = '';
  }

  /* ======= Eventos ======= */
  document.querySelectorAll('.mood').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      saveMood(mood);
      const sug = document.getElementById('suggestion');
      if (sug) {
        sug.textContent = getTip(
          mood === '😃' ? 'positive' : mood === '🙁' ? 'negative' : 'neutral');
        sug.classList.remove('hidden');
      }
      renderHistory();
    });
  });
  document.getElementById('saveEntry')?.addEventListener('click', handleNoteSave);
  window.addEventListener('load', renderHistory);
})();
