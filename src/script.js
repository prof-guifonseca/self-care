// Self-Care App – Core Consolidado v1.1 (2025-04-27)
(() => {
  'use strict';

  // ===== Configurações =====
  const STORAGE_HISTORY = 'sc_history';
  const STORAGE_NOTES   = 'sc_notes';
  const MAX_HISTORY     = 50;
  const DISPLAY_LIMIT   = 7;
  const API = {
    suggestion: '/.netlify/functions/suggestion',
    sentiment:  '/api/sentiment'
  };

  // ===== Elementos =====
  const entryEl       = document.getElementById('entry');
  const saveBtn       = document.getElementById('saveEntry');
  const suggestionEl  = document.getElementById('suggestion');
  const historyList   = document.getElementById('history-list');
  const moodButtons   = document.querySelectorAll('.mood');
  const moodChartCanv = document.getElementById('moodChart');
  let chart;

  // ===== Internacionalização (i18n) =====
  let locale = {};
  const t = key => locale[key] || key;
  async function loadLocale() {
    try {
      locale = await fetch('assets/locales/pt-br.json').then(r => r.json());
    } catch { locale = {}; }
    applyLocale();
  }
  function applyLocale() {
    document.querySelector('h1').textContent = t('appHeader');
    document.querySelector('#journal h2').textContent     = t('journalHeader');
    entryEl.placeholder    = t('placeholderEntry');
    saveBtn.textContent    = t('btnSave');
    document.querySelector('#checkin h2').textContent     = t('checkinHeader');
    document.querySelector('#history h2').textContent     = t('historyHeader');
    document.querySelector('.mood-picker').ariaLabel       = t('moodLabel');
    suggestionEl.ariaLabel = t('feedbackAria');
  }

  // ===== Helpers =====
  const formatTime = ts => new Date(ts)
    .toLocaleString('pt-BR', { weekday:'short', hour:'2-digit', minute:'2-digit' });

  async function fetchSuggestion({ mood, entryText, sentiment }) {
    try {
      const res = await fetch(API.suggestion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, entryText, sentiment })
      });
      if (!res.ok) throw new Error();
      const { suggestion } = await res.json();
      return suggestion;
    } catch {
      return t('errorSuggestion');
    }
  }

  async function analyzeSentiment(text) {
    try {
      const res = await fetch(API.sentiment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        const label = data[0]?.label || 'NEUTRAL';
        return label === 'NEGATIVE' ? -1 : label === 'POSITIVE' ? 1 : 0;
      }
      throw new Error();
    } catch {
      return 0;
    }
  }

  function saveHistory(mood) {
    const hist = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
    hist.unshift({ mood, time: Date.now() });
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(hist.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const hist = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
    historyList.innerHTML = '';
    hist.slice(0, DISPLAY_LIMIT).forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${item.mood}</span><span>${formatTime(item.time)}</span>`;
      historyList.appendChild(li);
    });
    updateChart(hist);
  }

  function updateChart(history) {
    if (!moodChartCanv || typeof Chart === 'undefined') return;
    const counts = {};
    history.forEach(i => counts[i.mood] = (counts[i.mood] || 0) + 1);
    const labels = Object.keys(counts);
    const data   = labels.map(l => counts[l]);
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
    } else {
      chart = new Chart(moodChartCanv.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ data }] },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  // ===== Handlers =====
  saveBtn.addEventListener('click', async () => {
    const text       = entryEl.value.trim();
    if (!text) return;
    const sentiment  = await analyzeSentiment(text);
    const suggestion = await fetchSuggestion({ mood: null, entryText: text, sentiment });
    suggestionEl.textContent = suggestion;
    suggestionEl.classList.remove('hidden');
    entryEl.value = '';
    saveHistory(sentiment > 0 ? '😃' : sentiment < 0 ? '🙁' : '😐');
    renderHistory();
  });

  moodButtons.forEach(btn => btn.addEventListener('click', async () => {
    const mood       = btn.dataset.mood;
    const suggestion = await fetchSuggestion({ mood, entryText: '', sentiment: 0 });
    suggestionEl.textContent = suggestion;
    suggestionEl.classList.remove('hidden');
    saveHistory(mood);
    renderHistory();
  }));

  // ===== Inicialização =====
  window.addEventListener('load', () => {
    loadLocale();
    renderHistory();
  });
})();
