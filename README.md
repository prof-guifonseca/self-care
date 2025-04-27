<!--
README – Self-Care PWA
Última revisão: 27 abr 2025
-->

<h1 align="center">🧘‍♂️ Self-Care • Check-in Diário</h1>

<p align="center">
App PWA 100 % offline-first para <strong>registrar humor</strong>,
receber <strong>dicas rápidas de autocuidado</strong> e
<cite>citações inspiradoras</cite> — tudo em menos de 10 kB  
(HTML + CSS + JS) e sem necessidade de back-end complexo.
</p>

<p align="center">
  <!-- troque pela URL de produção quando publicar -->
  <a href="https://self-care-demo.netlify.app" target="_blank">Acessar Demo</a> ·
  <a href="#contribuindo">Contribuir</a> ·
  <a href="LICENSE">Licença ISC</a>
</p>

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| **Mood Tracker** | Seleção rápida de humor com histórico e gráfico (Chart.js). |
| **Diário Relâmpago** | Campo de texto para desabafar; análise de sentimento (Azure Text Analytics → fallback local *sentiment.js*). |
| **Citações & Tradução** | Quote aleatória em EN, traduzida via LibreTranslate e cacheada localmente. |
| **Dicas de Autocuidado** | Sugestões contextuais (positivas, neutras ou negativas) em JSON local. |
| **Offline-First** | Service Worker + Indexed DB/`localStorage` garantem funcionamento sem internet. |
| **Serverless API** | 3 funções Netlify (`quote`, `translate`, `sentiment`) → zero servidor próprio. |
| **PWA** | Manifesto, ícones e instalação “Add to Home Screen”. |

---

## 📂 Estrutura
