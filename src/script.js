/* SelfCare – Core Script v0.7 (2025-04-27)
   ▸ Citações correlacionadas + tradução PT-BR
   ▸ Dicas de autocuidado correlacionadas (base local tagueada)
   ▸ Sentiment remoto (/api/sentiment) com fallback local
   ▸ 100 % offline se existir data/{quotes,selfcare-tips}.json
*/

(() => {
  'use strict';

  /* === Config === */
  const STORAGE       = { history: 'sc_history', notes: 'sc_notes' };
  const MAX_HISTORY   = 50;
  const DISPLAY_LIMIT = 7;

  const API_SENTIMENT = '/api/sentiment';      // Function sentiment.js
  const API_QUOTE     = '/api/quote';          // Function quote.js (inglês)
  const API_TRANSLATE = 'https://libretranslate.de/translate';   // 100 req/dia/IP

  /* === Datasets locais (carregados assíncrono) === */
  let taggedQuotes = {};                       // data/quotes.json
  let taggedTips   = {};                       // data/selfcare-tips.json

  /* === Fallbacks === */
  const LOCAL_QUOTES = [
    { q: 'A felicidade da sua vida depende da qualidade dos seus pensamentos.', a: 'Marco Aurélio' },
    { q: 'Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.', a: 'Sêneca' },
    { q: 'Primeiro diga a si mesmo o que você seria; e depois faça o que tem de fazer.', a: 'Epicteto' }
  ];

  const FALLBACK_TIPS = {
    positive: ['Celebre algo bom de hoje ✨'],
    neutral : ['Alongue os ombros e respire fundo.'],
    negative: ['Faça 3 ciclos de respiração 4-7-8 e relaxe.'],
    stress  : ['Faça uma pausa de 3 min e feche os olhos.'],
    sleep   : ['Desconecte-se de telas 30 min antes de dormir.']
  };

  /* === Taxonomias === */
  const TOPICS = {
    stress: ['cansado','estressado','ansioso','sobrecarregado','pressionado'],
    sleep : ['sono','dormir','insônia'],
    happy : ['feliz','grato','animado','orgulhoso'],
    social: ['sozinho','isolado','amigos','família']
  };

  /* === Pré-carrega arquivos locais === */
  fetch('data/quotes.json')
    .then(r => r.ok ? r.json() : {})
    .then(j => taggedQuotes = j);

  fetch('data/selfcare-tips.json')
    .then(r => r.ok ? r.json() : {})
    .then(j => taggedTips = j);

  /* === Sentiment local (fallback) === */
  const SentimentAnalyzer = typeof Sentiment !== 'undefined' ? new Sentiment() : null;

  /* === Helpers === */
  const rand   = arr => arr[Math.floor(Math.random() * arr.length)];
  const format = ts  => new Date(ts)
                         .toLocaleString('pt-BR',{ weekday:'short', hour:'2-digit', minute:'2-digit' });

  const detectTopic = txt =>
    Object.keys(TOPICS).find(k => TOPICS[k].some(w => txt.toLowerCase().includes(w)));

  /* === Tradução en→pt (best effort) === */
  async function translateToPT(text) {
    try {
      const r = await fetch(API_TRANSLATE, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ q: text, source:'en', target:'pt', format:'text' })
      });
      if (!r.ok) throw 0;
      const { translatedText } = await r.json();
      return translatedText || text;
    } catch { return text; }
  }

  /* === Citação correlacionada === */
  async function getQuote(label) {
    /* 1. offline: pool tagueado */
    if (taggedQuotes[label]?.length) return rand(taggedQuotes[label]);

    /* 2. online: Function quote.js + tradução */
    try {
      const r = await fetch(API_QUOTE);
      if (!r.ok) throw 0;
      const obj = await r.json();          // { q, a } (inglês)
      obj.q = await translateToPT(obj.q);
      return obj;
    } catch { return rand(LOCAL_QUOTES); }
  }

  /* === Dica de autocuidado correlacionada === */
  function getTip(label) {
    /* 1. offline pool */
    if (taggedTips[label]?.length) return rand(taggedTips[label]).tip;

    /* 2. fallback fixo */
    return rand(FALLBACK_TIPS[label] || FALLBACK_TIPS.neutral);
  }

  /* === Sentiment remoto + fallback === */
  async function cloudScore(text) {
    try {
      const res = await fetch(API_SENTIMENT, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ text })
      });
      if (!res.ok) throw 0;
      const [{ label = 'NEUTRAL' }] = await res.json();
      return label === 'NEGATIVE' ? -1 : label === 'POSITIVE' ? 1 : 0;
    } catch {
      return SentimentAnalyzer ? SentimentAnalyzer.analyze(text).score : 0;
    }
  }

  /* === Histórico === */
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
      const li = document.createElement('li');
      li.innerHTML = `<span>${i.mood}</span><span>${format(i.time)}</span>`;
      list.appendChild(li);
    });
    updateChart(h);
  };

  /* === Chart opcional === */
  let chart;
  const updateChart = history => {
    const canvas = document.getElementById('moodChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const counts = {};
    history.forEach(({ mood }) => counts[mood] = (counts[mood] || 0) + 1);
    const labels = Object.keys(counts);
    const data   = labels.map(l => counts[l]);

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
      return;
    }
    chart = new Chart(canvas.getContext('2d'), {
      type   : 'bar',
      data   : { labels, datasets:[{ data, borderWidth:0 }] },
      options: { plugins:{ legend:{ display:false } },
                 scales : { y:{ beginAtZero:true, ticks:{ precision:0 } } } }
    });
  };

  /* === Diário / Nota rápida === */
  async function handleNoteSave() {
    const textarea = document.getElementById('entry');
    const text     = textarea.value.trim();
    if (!text) return;

    /* salva nota local */
    const notes = JSON.parse(localStorage.getItem(STORAGE.notes) || '[]');
    notes.unshift({ text, time: Date.now() });
    localStorage.setItem(STORAGE.notes, JSON.stringify(notes.slice(0,30)));

    /* análise + outputs */
    const score   = await cloudScore(text);
    const topic   = detectTopic(text);
    const label   = topic || (score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral');

    const { q, a } = await getQuote(label);
    const tip      = getTip(label);

    /* mostra UI */
    document.getElementById('autoFeedback').textContent = tip;
    document.getElementById('autoFeedback').classList.remove('hidden');

    document.getElementById('quoteText').textContent   = `"${q}"`;
    document.getElementById('quoteAuthor').textContent = `— ${a}`;
    document.getElementById('quoteBox').classList.remove('hidden');

    /* humor deduzido */
    saveMood(score > 0 ? '😃' : score < 0 ? '🙁' : '😐');
    renderHistory();

    textarea.value = '';
  }

  /* === Eventos UI === */
  document.querySelectorAll('.mood').forEach(btn =>
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      saveMood(mood);

      const sug = document.getElementById('suggestion');
      if (sug) {
        const tip = getTip(mood === '😃' ? 'positive'
                         : mood === '🙁' ? 'negative'
                         : 'neutral');
        sug.textContent = tip;
        sug.classList.remove('hidden');
      }
      renderHistory();
    })
  );

  const saveBtn = document.getElementById('saveEntry');
  if (saveBtn) saveBtn.addEventListener('click', handleNoteSave);

  window.addEventListener('load', renderHistory);
})();
