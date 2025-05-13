// Core Modularizado v2.2 Consolidado (front-end ajustado para “passage”)
(() => {
  'use strict';

  // ===== Configurações =====
  const API = {
    suggestion: '/.netlify/functions/suggestion'
  };
  const STORAGE_KEY = 'godcares_history';
  const MAX_HISTORY = 20;

  // ===== Utilitários DOM =====
  const $ = selector => document.querySelector(selector);

  // ===== Elementos =====
  const entryEl        = $('#entry');
  const receiveBtn     = $('#receiveWord');
  const wordSection    = $('#word-section');
  const verseEl        = $('#verse');
  const contextEl      = $('#context');
  const applicationEl  = $('#application');
  const historySection = $('#history-section');
  const historyList    = $('#history-list');

  // ===== Funções Principais =====
  async function fetchWord(entryText) {
    try {
      const res = await fetch(API.suggestion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryText })
      });
      if (!res.ok) throw new Error();
      // agora esperamos { passage, context, application }
      const { passage, context, application } = await res.json();
      return { passage, context, application };
    } catch (err) {
      console.error('[GodCares] Erro ao buscar Palavra:', err);
      return {
        passage: '⚠️ Não foi possível gerar uma Palavra agora.',
        context: '',
        application: 'Tente novamente em alguns instantes.'
      };
    }
  }

  function saveHistory(passage, context, application) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.unshift({ verse: passage, context, application, time: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (history.length === 0) {
      historySection.classList.add('hidden');
      return;
    }
    historySection.classList.remove('hidden');
    historyList.innerHTML = '';
    history.forEach(({ verse, time }) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${new Date(time).toLocaleDateString('pt-BR')}</strong>: ${verse}`;
      historyList.appendChild(li);
    });
  }

  // ===== Eventos =====
  receiveBtn.addEventListener('click', async () => {
    const text = entryEl.value.trim();
    if (!text) return;

    verseEl.textContent       = '⌛ Buscando uma Palavra de Esperança...';
    contextEl.textContent     = '';
    applicationEl.textContent = '';
    wordSection.classList.remove('hidden');

    // usamos passage em vez de verse
    const { passage, context, application } = await fetchWord(text);

    verseEl.textContent       = `📖 ${passage}`;
    contextEl.textContent     = context;
    applicationEl.textContent = application;

    verseEl.classList.add('fade-in');
    contextEl.classList.add('fade-in');
    applicationEl.classList.add('fade-in');

    saveHistory(passage, context, application);
    renderHistory();

    entryEl.value = '';
  });

  // ===== Inicialização =====
  window.addEventListener('load', () => {
    renderHistory();
  });

})();
