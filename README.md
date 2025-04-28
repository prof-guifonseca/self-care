<!--
README – SelfCare ✝️
Última revisão: 28 abr 2025
-->

<h1 align="center">✝️ SelfCare • Palavras de Esperança</h1>

<p align="center">
  <a href="https://selfcare-palavras.netlify.app" target="_blank">Acessar Demo</a> ·
  <a href="#contribuindo">Contribuir</a> ·
  <a href="LICENSE">Licença ISC</a>
</p>

<p align="center">
  <a href="https://github.com/prof-guifonseca/self-care/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/prof-guifonseca/self-care/actions/workflows/ci.yml/badge.svg">
  </a>
  <a href="https://github.com/prof-guifonseca/self-care/actions/workflows/codeql.yml">
    <img alt="CodeQL" src="https://github.com/prof-guifonseca/self-care/actions/workflows/codeql.yml/badge.svg">
  </a>
  <a href="https://app.netlify.com/sites/selfcare-palavras/deploys">
    <img alt="Netlify Status" src="https://api.netlify.com/api/v1/badges/f38e7b8a-fdae-4b63-9b34-de0dc0b7a68d/deploy-status">
  </a>
</p>

<p align="center">
  Aplicativo <strong>PWA</strong> focado no <strong>autocuidado espiritual</strong>.<br/>
  Descreva seu momento e receba uma <strong>Palavra bíblica</strong> e uma <strong>reflexão inspiradora</strong>.<br/>
  Funciona totalmente <strong>offline</strong> após instalado.
</p>

---

## ✨ Funcionalidades

| Recurso                   | Descrição |
|:---------------------------|:----------|
| **Entrada Espiritual**     | Campo de texto para o usuário compartilhar sentimentos, orações ou desabafos. |
| **Gerador de Palavra**     | Geração de versículo bíblico + reflexão usando OpenAI (serverless function). |
| **Histórico Local**        | Salva localmente as Palavras recebidas para revisitar quando quiser. |
| **Offline-First**          | Funciona sem internet após o primeiro acesso (Service Worker). |
| **Instalável**             | Compatível com "Add to Home Screen" como um aplicativo real. |
| **Deploy Serverless**      | Funções Netlify para chamadas API com proteção de variáveis ambiente. |
