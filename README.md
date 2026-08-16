# Apoia PDPJ — Assistente MCP (Userscript Tampermonkey)

Painel lateral acionável por **`Alt + M`** que expõe as ferramentas de inteligência e automação **MCP (Model Context Protocol)** da plataforma **Apoia / PDPJ** (`https://apoia.pdpj.jus.br`) diretamente no navegador, via **Tampermonkey**.

Arquivo principal: [`apoia-mcp-assistant.user.js`](apoia-mcp-assistant.user.js)

---

## ✨ Recursos

- **Acionamento por teclado** (`Alt + M`); `Esc` fecha o painel/visualizador.
- **Temas** Escuro (padrão), Claro e Sépia, com preferência salva.
- **Formulários dinâmicos** gerados a partir do schema de cada ferramenta, com:
  - **exemplo pré-preenchido** por ferramenta (`defaultArgs`);
  - **texto explicativo em PT ao lado do rótulo oficial** dos campos técnicos (`FIELD_HELP`) — ex.: `sourceSlugs`, `searchType`, `hybridAlpha`, `orgaos`, `tipos`.
- **Resultado em 3 visões**: Visual (formatada), Markdown e JSON.
- **Integração Metadados ➡️ Leitura de Peças**: em *Metadados Processuais*, cada documento tem o botão **`📄 Ler Peça`**, que abre o texto integral no visualizador.
- **Configuração de token/URL** do MCP e **histórico** de consultas.
- **Inserir no cursor / Copiar** o resultado ou o texto da peça.

### Tratamento de erros resiliente

- **Auto-retry no *Ler Peça***: quando o serviço de extração de texto do PJe (*Codex*) devolve erro transitório (HTTP 500), o painel **retenta automaticamente até 3×** antes de exibir um aviso amigável.
- **Peça não encontrada**: identificador inexistente/sem metadados vira um card explicativo, em vez do erro cru.
- **Serviço indisponível**: falhas de backend (`fetch failed`, `ECONNREFUSED`, `502/503/504`, timeouts) são traduzidas para mensagem amigável **em todas as ferramentas**, com botão **“Tentar novamente”**.
- **Token expirado (401)**: card dedicado com link para renovar o token no portal.

---

## 🧰 Ferramentas disponíveis

| Categoria | Ferramenta | Descrição |
|---|---|---|
| **Processos & Peças** | Metadados Processuais | Metadados de um processo pelo número. |
| | Texto de Peças Processuais | Texto integral de uma ou mais peças. |
| | Documentos da Minha Biblioteca | Conteúdo de minutas/teses/modelos salvos na Biblioteca. |
| **Jurisprudência** | Pangea (STF/STJ) | Teses, súmulas, OJs, temas de repercussão geral e repetitivos. |
| | Busca Semântica / Híbrida | Busca vetorial/híbrida em temas de RG do STF e repetitivos do STJ. |
| | Leading Case (Paradigma) | Temas pelo número do processo paradigma. |
| | Precedentes Jurisprudenciais | Busca de precedentes com operadores lógicos. |
| **Prazos & Datas** | Data Atual Oficial | Data de hoje (DD/MM/YYYY). |
| | Diferença de Prazos | Diferença entre duas datas em anos/meses/dias. |
| | Somar/Subtrair Prazos | Data final somando/subtraindo anos/meses/dias. |
| **Cálculos** | Calculadora de Expressões | Avaliação de expressões matemáticas em lote. |

---

## 📥 Instalação / Atualização (Firefox + Tampermonkey)

1. Abra o painel do **Tampermonkey**.
2. Crie/edite o userscript e **cole o conteúdo** de [`apoia-mcp-assistant.user.js`](apoia-mcp-assistant.user.js).
3. Salve com `Ctrl + S`.
4. **Recarregue (F5)** as abas do PDPJ já abertas — o Tampermonkey só injeta a versão nova em páginas carregadas após a atualização.
5. Pressione **`Alt + M`** em qualquer página para abrir o painel.

> **Configuração do token:** abra o painel → ⚙️ Configurações → informe a URL do MCP e o token obtidos em `https://apoia.pdpj.jus.br/mcp`.

---

## 🗒️ Histórico de versões

- **1.4.5** — Tratamento de erros de serviço unificado em **todas** as ferramentas (mensagem amigável + “Tentar novamente”), inclusive no caminho de erro *lançado* (`isError`/HTTP 5xx).
- **1.4.4** — Card amigável para **“Peça não encontrada”**; tradução de erros de serviço (ex.: `fetch failed` em *Precedentes*) para mensagem clara + retry.
- **1.4.3** — **Auto-retry** no *Ler Peça* para erro transitório do Codex; limpeza dos presets internos não utilizados.
- **1.4.2** — **Texto explicativo ao lado dos rótulos** dos campos técnicos; remoção do bloco “Exemplos rápidos” (o exemplo continua pré-preenchido via `defaultArgs`).
- **1.4.1** — Correção do *Ler Peça* (envio de `pieceIdArray` como array).
- **1.4.0** — Temas (Escuro/Claro/Sépia), integração Metadados → Leitura de Peças, Documentos da Biblioteca, acionamento por `Alt + M`.
