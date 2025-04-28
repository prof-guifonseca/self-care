// SelfCare App – Core Consolidado v1.2 (2025-04-28)
(() => {
'use strict';

const STORAGE_HISTORY = 'sc_history';
const MAX_HISTORY = 50;
const DISPLAY_LIMIT = 7;
const API = {
  suggestion: '/.netlify/functions/suggestion',
  sentiment: '/api/sentiment'
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const entryEl = $('#entry');
const saveBtn = $('#saveEntry');
const suggestionEl = $('#suggestion');
const historyList = $('#history-list');
const moodButtons = $$('.mood');
const moodChartCanv = $('#moodChart');
let chart;

let locale = {};
const t = key => locale[key] || key;

async function loadLocale() {
  try {
    locale = await fetch('assets/locales/pt-br.json').then(r => r.json());
  } catch {
    locale = {};
  }
  applyLocale();
}

function applyLocale() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (locale[key]) el.textContent = locale[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (locale[key]) el.setAttribute('placeholder', locale[key]);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (locale[key]) el.setAttribute('aria-label', locale[key]);
  });
}

const formatTime = ts => new Date(ts).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

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
    return t('errorSuggestion') || 'Não foi possível gerar sugestão.';
  }
}

async function analyzeSentiment(text) {
  try {
    const res = await fetch(API.sentiment, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error();
    const [data] = await res.json();
    const label = data?.label || 'NEUTRAL';
    return label === 'NEGATIVE' ? -1 : label === 'POSITIVE' ? 1 : 0;
  } catch {
    return 0;
  }
}

function saveHistory(mood) {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
  history.unshift({ mood, time: Date.now() });
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
  historyList.innerHTML = '';
  history.slice(0, DISPLAY_LIMIT).forEach(({ mood, time }) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${mood}</span><span>${formatTime(time)}</span>`;
    historyList.appendChild(li);
  });
  updateChart(history);
}

function updateChart(history) {
  if (!moodChartCanv || typeof Chart === 'undefined') return;
  const counts = history.reduce((acc, { mood }) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(moodChartCanv.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: '#4D6FE4' }] },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

saveBtn.addEventListener('click', async () => {
  const text = entryEl.value.trim();
  if (!text) return;
  const sentiment = await analyzeSentiment(text);
  const suggestion = await fetchSuggestion({ mood: null, entryText: text, sentiment });
  suggestionEl.textContent = suggestion;
  suggestionEl.classList.remove('hidden');
  entryEl.value = '';
  saveHistory(sentiment > 0 ? '😃' : sentiment < 0 ? '🙁' : '😐');
  renderHistory();
});

moodButtons.forEach(btn => btn.addEventListener('click', async () => {
  const mood = btn.dataset.mood;
  const suggestion = await fetchSuggestion({ mood, entryText: '', sentiment: 0 });
  suggestionEl.textContent = suggestion;
  suggestionEl.classList.remove('hidden');
  saveHistory(mood);
  renderHistory();
}));

window.addEventListener('load', () => {
  loadLocale();
  renderHistory();
});
})();
