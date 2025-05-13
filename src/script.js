// Core Modularizado v2.2 Ajustado para usar passage e reference
(() => {
  'use strict';

  const API = { suggestion: '/.netlify/functions/suggestion' };
  const STORAGE_KEY = 'godcares_history';
  const MAX_HISTORY = 20;
  const $ = sel => document.querySelector(sel);

  const entryEl       = $('#entry');
  const receiveBtn    = $('#receiveWord');
  const verseEl       = $('#verse');
  const contextEl     = $('#context');
  const applicationEl = $('#application');
  const historyList   = $('#history-list');
  const historySection = $('#history-section');

  async function fetchWord(text) {
    try {
      const res = await fetch(API.suggestion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryText: text })
      });
      if (!res.ok) throw new Error();
      // destruturamos passage, context, application e reference
      const { reference, passage, context, application } = await res.json();
      return { reference, passage, context, application };
    } catch {
      return {
        reference: '',
        passage: '⚠️ Erro ao gerar Palavra.',
        context: '',
        application: ''
      };
    }
  }

  function saveHistory(ref, passage) {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    h.unshift({ ref, passage, time: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
  }

  function renderHistory() {
    const h = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    if (!h.length) { historySection.classList.add('hidden'); return; }
    historySection.classList.remove('hidden');
    historyList.innerHTML = '';
    h.forEach(({ ref, passage, time }) => {
      const li = document.createElement('li');
      li.textContent = `${new Date(time).toLocaleDateString('pt-BR')} – ${ref}`;
      historyList.appendChild(li);
    });
  }

  receiveBtn.addEventListener('click', async () => {
    const text = entryEl.value.trim();
    if (!text) return;

    verseEl.textContent = '⌛ Buscando a Palavra…';
    contextEl.textContent = '';
    applicationEl.textContent = '';
    $('#word-section').classList.remove('hidden');

    const { reference, passage, context, application } = await fetchWord(text);

    verseEl.textContent       = reference ? `📖 ${reference}` : `📖 ${passage}`;
    contextEl.textContent     = context;
    applicationEl.textContent = application;

    saveHistory(reference, passage);
    renderHistory();

    entryEl.value = '';
  });

  window.addEventListener('load', renderHistory);
})();
