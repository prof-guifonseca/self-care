// GodCares ✝️ — Core Principal v2.1 (2025-04-28)
(() => {
  'use strict';

  // ===== Configurações =====
  const API = {
    suggestion: '/.netlify/functions/suggestion'
  };
  const STORAGE_KEY = 'godcares_history';
  const MAX_HISTORY = 20;

  // ===== Utilitário DOM =====
  const $ = s => document.querySelector(s);

  // ===== Elementos =====
  const entryEl        = $('#entry');
  const receiveBtn     = $('#receiveWord');
  const wordSection    = $('#word-section');
  const verseEl        = $('#verse');
  const reflectionEl   = $('#reflection');
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
      const { verse, reflection } = await res.json();
      return { verse, reflection };
    } catch (err) {
      console.error('[GodCares] Erro ao buscar Palavra:', err);
      return {
        verse: '⚠️ Não foi possível gerar uma Palavra agora.',
        reflection: 'Tente novamente em alguns instantes.'
      };
    }
  }

  function saveHistory(verse, reflection) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.unshift({ verse, reflection, time: Date.now() });
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

    verseEl.innerHTML = "⌛ Buscando uma Palavra de Esperança...";
    reflectionEl.innerHTML = "";
    wordSection.classList.remove('hidden');

    const { verse, reflection } = await fetchWord(text);

    verseEl.innerHTML = `📖 ${verse}`;
    reflectionEl.innerHTML = reflection;

    verseEl.classList.add('fade-in');
    reflectionEl.classList.add('fade-in');

    saveHistory(verse, reflection);
    renderHistory();

    entryEl.value = '';
  });

  // ===== Inicialização =====
  window.addEventListener('load', () => {
    renderHistory();
  });

})();
