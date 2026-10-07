# Apoia — Assistente MCP (Userscript Tampermonkey)

Painel lateral acionável por **`Alt + M`** que expõe as ferramentas de inteligência e automação **MCP (Model Context Protocol)** da plataforma **Apoia** diretamente no navegador, via **Tampermonkey**.

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
| | Decisões (Julia TRF5) | Sentenças, acórdãos de TR/TRU e ementas do TRF5 indexados na Julia, para um ou mais processos (quadro comparativo de conexos). Não usa o token do Apoia. |
| | Busca Processual Unificada | Processos de 1º e 2º grau da 5ª Região por nome, CPF/CNPJ, número ou classe, na mesma base do painel **Busca Processual Unificada** do TRF5 (Portal BI, carga diária), sem abrir aba. Não usa o token do Apoia. |
| | Documentos da Minha Biblioteca | Conteúdo de minutas/teses/modelos salvos na Biblioteca. |
| **Jurisprudência** | Pangea (STF/STJ) | Teses, súmulas, OJs, temas de repercussão geral e repetitivos. |
| | Busca Semântica / Híbrida | Busca vetorial/híbrida em temas de RG do STF e repetitivos do STJ. |
| | Inteiro Teor de Precedentes | Texto completo de até 10 documentos pelos IDs da busca de Precedentes (também pelo botão **Inteiro teor** em cada resultado). |
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

- **1.8.0** — Nova ferramenta local **Busca Processual Unificada**: consulta a mesma base do painel *Busca Processual Unificada* do TRF5 (Portal BI/Qlik, carga diária) — 1º e 2º grau da 5ª Região — por **Nome**, **CPF/CNPJ**, **Número do Processo** ou **Classe Judicial**, apresentando as colunas do painel (parte, papel, documento mascarado, número, classe, sistema, seção, grau, instância, link da consulta pública). Sem token do Apoia e sem abrir aba: a consulta ao motor Qlik sai de um `iframe sandbox` criado **apenas durante a execução** e descartado em seguida — nada é conectado no carregamento da página. Busca por CPF/CNPJ normaliza a pontuação; número aceita com ou sem máscara; nome aceita aspas (expressão exata) e `*`.
- **1.7.0** — Suporte à tool **`precedentFullText`** (*Inteiro Teor de Precedentes*): nome amigável, ajuda dos campos, IDs aceitos separados por vírgula/espaço e exibição por documento (processo, classe, UF, *Ler íntegra* / *Copiar íntegra*, Markdown). Cada resultado de *Precedentes Jurisprudenciais* ganha o botão **Inteiro teor**, que abre o texto no visualizador. Os resultados de Precedentes passam a exibir ementa/trecho e tipo do documento. O erro «não configurada para o seu tribunal (JURISPRUDENCIA_URL)» vira aviso claro de que a base de jurisprudência não está habilitada no Apoia para o tribunal do usuário. Correção: após um erro, as abas JSON/Markdown não mostram mais o resultado da consulta anterior.
- **1.6.0** — Nova ferramenta local **Decisões (Julia TRF5)**: consulta direta à API pública da Julia (`juliapesquisa.trf5.jus.br/julia-pesquisa/api/v1/processo/{numero}`), sem passar pelo Apoia — continua disponível com o token expirado. Aceita vários números CNJ (ou um texto colado, de onde os números são extraídos) e, com 2+ processos, abre um **quadro comparativo** para conexos. Cada decisão aparece em ordem cronológica com instância, órgão julgador, magistrado(a), **resultado** (procedente, provido, não conhecido…) e votação extraídos por heurística do **dispositivo** destacado, além de *Ler íntegra* / *Copiar íntegra*. Remove as duplicatas que a Julia devolve e restos de HTML do texto.
- **1.5.4** — Modo expandido ocupa o painel inteiro: oculta também a barra de token e as abas de categoria, reduz margens e remove a rolagem interna da linha do tempo (fica uma única rolagem). Ao expandir, as movimentações passam a exibir todas automaticamente (e voltam às 8 recentes ao recolher). O filtro de movimentações agora mostra todas as correspondências, não só as 8 primeiras; o botão já exibe a contagem e some quando há 8 ou menos.
- **1.5.3** — Token expirado (HTTP 401) agora abre automaticamente o painel de Configurações com o cursor no campo de token, tanto na carga inicial quanto ao executar uma ferramenta. O modo expandido de resultados passa a ocultar também os painéis de Configurações e Histórico; abrir qualquer um deles recolhe o modo expandido.
- **1.5.2** — Correção definitiva do «expected array, received string» (MCP error -32602): em páginas com Prototype.js antigo (ex.: PJe), `Array.prototype.toJSON` fazia o `JSON.stringify` do payload JSON-RPC serializar arrays como *string* — a 1.4.1 corrigia o chamador, mas a corrupção acontecia depois, na serialização. O payload agora usa `safeJsonStringify` (arrays/objetos montados à mão).
- **1.4.6** — `@updateURL`/`@downloadURL` apontando para o raw do GitHub (auto-update do Tampermonkey — requer repositório **público**).
- **1.4.5** — Tratamento de erros de serviço unificado em **todas** as ferramentas (mensagem amigável + “Tentar novamente”), inclusive no caminho de erro *lançado* (`isError`/HTTP 5xx).
- **1.4.4** — Card amigável para **“Peça não encontrada”**; tradução de erros de serviço (ex.: `fetch failed` em *Precedentes*) para mensagem clara + retry.
- **1.4.3** — **Auto-retry** no *Ler Peça* para erro transitório do Codex; limpeza dos presets internos não utilizados.
- **1.4.2** — **Texto explicativo ao lado dos rótulos** dos campos técnicos; remoção do bloco “Exemplos rápidos” (o exemplo continua pré-preenchido via `defaultArgs`).
- **1.4.1** — Correção do *Ler Peça* (envio de `pieceIdArray` como array).
- **1.4.0** — Temas (Escuro/Claro/Sépia), integração Metadados → Leitura de Peças, Documentos da Biblioteca, acionamento por `Alt + M`.
