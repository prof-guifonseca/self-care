// SelfCare ✝️ • Core Renovado (v2.0, 2025-04-28)
(() => {
  'use strict';

  // ===== Configurações =====
  const API = {
    suggestion: '/.netlify/functions/suggestion'
  };

  // ===== Elementos =====
  const $ = s => document.querySelector(s);

  const entryEl = $('#entry');
  const receiveBtn = $('#receiveWord');
  const wordSection = $('#word-section');
  const verseEl = $('#verse');
  const reflectionEl = $('#reflection');
  const historyList = $('#history-list');
  const historySection = $('#history-section');

  const STORAGE_HISTORY = 'sc_history';
  const MAX_HISTORY = 20;

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
      console.error('Erro ao buscar Palavra:', err);
      return {
        verse: '⚠️ Não foi possível gerar uma Palavra agora.',
        reflection: 'Tente novamente em alguns instantes.'
      };
    }
  }

  function saveHistory(verse, reflection) {
    const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
    history.unshift({ verse, reflection, time: Date.now() });
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
    if (!history.length) {
      historySection.classList.add('hidden');
      return;
    }
    historySection.classList.remove('hidden');
    historyList.innerHTML = '';
    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${new Date(item.time).toLocaleDateString('pt-BR')}</strong>: ${item.verse}`;
      historyList.appendChild(li);
    });
  }

  // ===== Eventos =====
  receiveBtn.addEventListener('click', async () => {
    const text = entryEl.value.trim();
    if (!text) return;

    const { verse, reflection } = await fetchWord(text);

    verseEl.textContent = verse;
    reflectionEl.textContent = reflection;

    wordSection.classList.remove('hidden');

    saveHistory(verse, reflection);
    renderHistory();

    entryEl.value = '';
  });

  // ===== Inicialização =====
  window.addEventListener('load', () => {
    renderHistory();
  });

})();
