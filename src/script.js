// GodCares ✝️ — Core Modularizado v2.2 (2025-04-28)
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
      const { verse, context, application } = await res.json();
      return { verse, context, application };
    } catch (err) {
      console.error('[GodCares] Erro ao buscar Palavra:', err);
      return {
        verse: '⚠️ Não foi possível gerar uma Palavra agora.',
        context: '',
        application: 'Tente novamente em alguns instantes.'
      };
    }
  }

  function saveHistory(verse, context, application) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.unshift({ verse, context, application, time: Date.now() });
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

    verseEl.textContent = "⌛ Buscando uma Palavra de Esperança...";
    contextEl.textContent = "";
    applicationEl.textContent = "";
    wordSection.classList.remove('hidden');

    const { verse, context, application } = await fetchWord(text);

    verseEl.textContent = `📖 ${verse}`;
    contextEl.textContent = context;
    applicationEl.textContent = application;

    verseEl.classList.add('fade-in');
    contextEl.classList.add('fade-in');
    applicationEl.classList.add('fade-in');

    saveHistory(verse, context, application);
    renderHistory();

    entryEl.value = '';
  });

  // ===== Inicialização =====
  window.addEventListener('load', () => {
    renderHistory();
  });

})();
