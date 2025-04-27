<!--
README – Self‑Care PWA
Última revisão: 27 abr 2025
-->

<h1 align="center">🧘‍♂️ Self‑Care • Check‑in Diário</h1>

<p align="center">
  <a href="https://selfcare-checkin.netlify.app" target="_blank">Acessar Demo</a> ·
  <a href="#contribuindo">Contribuir</a> ·
  <a href="LICENSE">Licença ISC</a>
</p>

<p align="center">
  <a href="https://github.com/prof-guifonseca/self-care/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/prof-guifonseca/self-care/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/prof-guifonseca/self-care/actions/workflows/codeql.yml"><img alt="CodeQL" src="https://github.com/prof-guifonseca/self-care/actions/workflows/codeql.yml/badge.svg"></a>
  <a href="https://api.netlify.com/api/v1/badges/f38e7b8a-fdae-4b63-9b34-de0dc0b7a68d/deploy-status"><img alt="Netlify Status" src="https://api.netlify.com/api/v1/badges/f38e7b8a-fdae-4b63-9b34-de0dc0b7a68d/deploy-status"></a>
</p>

<p align="center">
  App PWA <strong>100 % offline‑first</strong> para <strong>registrar humor</strong>,<br/>
  receber <strong>dicas rápidas de autocuidado</strong> e <cite>citações inspiradoras</cite><br/>
  — tudo em ≈10 kB de HTML + CSS + JS, sem back‑end dedicado.
</p>

---

## ✨ Funcionalidades

| Recurso               | Descrição                                                                                          |
|-----------------------|----------------------------------------------------------------------------------------------------|
| **Mood Tracker**      | Seleção de emojis com histórico e gráfico (Chart.js minificado).                                    |
| **Diário Relâmpago**   | Campo de texto; análise de sentimento pela lambda `sentiment` (HuggingFace) com fallback local.     |
| **Citações & Tradução**| Quote aleatória em inglês, traduzida a PT‑BR via lambda `translate` + cache local.                 |
| **Dicas de Autocuidado** | Sugestões positivas, neutras ou negativas em JSON local e tagueadas.                              |
| **Offline‑First**     | Service Worker cache‑first; datasets locais garantem funcionamento total sem internet.               |
| **Serverless API**    | 3 funções Netlify (`quote`, `translate`, `sentiment`) — zero servidor próprio.                     |
| **PWA**               | Manifesto, ícones 192 / 512 px e instalação "Add to Home Screen".                                   |

---

## 📂 Estrutura

```
.
├─ src/                 # app estático (HTML, CSS, JS, manifest)
│  ├─ assets/           # ícones PWA
│  ├─ data/             # quotes.json / selfcare-tips.json
│  ├─ serviceWorker.js
│  └─ index.html        # PWA entrypoint
├─ netlify/functions/   # λ serverless
│  └─ {quote,translate,sentiment}.js
├─ netlify.toml         # config deploy
├─ package.json         # scripts + dependências dev
└─ .github/workflows/   # ci.yml / codeql.yml / netlify.yml
``` 

---

## 🚀 Começando

### Pré‑requisitos

* **Node ≥ 18**
* **Netlify CLI** `npm i -g netlify-cli`

### Clonar e rodar local

```bash
# clone
git clone https://github.com/prof-guifonseca/self-care.git
cd self-care

# instalar dependências (dev only)
npm ci

# executar app + funções
netlify dev --port 8888
```

Acesse <http://localhost:8888>.

### Build estático

Se precisar apenas dos arquivos estáticos:
```bash
npm run build
```

---

## 🛠️ Scripts úteis

| Comando           | O que faz                                     |
|-------------------|-----------------------------------------------|
| `npm run lint`    | ESLint + Prettier                             |
| `npm test`        | _(futuro)_ Vitest                             |
| `netlify build`   | Gera pasta `dist/` pronta para deploy         |

---

## 🗺️ Roadmap

- [x] Emojis & histórico funcional            
- [x] PWA instalável com ícones corretos      
- [ ] Dark‑mode automático (`prefers-color-scheme`)  
- [ ] Exportar histórico CSV                   
- [ ] Testes unitários (Vitest)                

---

## 🤝 Contribuindo

1. Faça *fork* do projeto e crie sua branch: `git checkout -b feat/minha-feature`  
2. `npm run lint && npm test`                                             
3. *Commit* suas mudanças: `git commit -m "feat: minha feature"`          
4. *Push* para o fork: `git push origin feat/minha-feature`                
5. Abra *pull request* <sup>(template PR ajuda no passo‑a‑passo)</sup>       

Leia `CONTRIBUTING.md` para detalhes.

---

## 📝 Licença

Distribuído sob **Licença ISC**. Consulte o arquivo [`LICENSE`](LICENSE) para mais informações.

---

> Feito com ☕ + 💙 por **@prof‑guifonseca**  
> “Respire fundo, escreva três coisas boas de hoje e siga em frente.”
