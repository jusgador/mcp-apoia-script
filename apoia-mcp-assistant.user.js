// ==UserScript==
// @name         Apoia PDPJ - Assistente MCP
// @namespace    https://apoia.pdpj.jus.br/
// @version      1.4.5
// @description  Painel lateral acionável via Alt+M para ferramentas MCP do Apoia/PDPJ (Metadados de Processos, Leitura de Peças, Documentos da Biblioteca, Jurisprudência Pangea, Prazos e Cálculos) com temas Escuro, Claro e Sépia.
// @author       Antigravity / Apoia PDPJ
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      apoia.pdpj.jus.br
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================
  // CONFIGURAÇÃO E CONSTANTES
  // ==========================================
  const DEFAULT_TOKEN = '7cb6b39c9c3f4a31b32a9fc31ba0c4da';
  const DEFAULT_BASE_URL = 'https://apoia.pdpj.jus.br/api/mcp/mcp';
  const TOKEN_PORTAL_URL = 'https://apoia.pdpj.jus.br/mcp';
  const LIBRARY_PORTAL_URL = 'https://apoia.pdpj.jus.br';

  const STORAGE_KEYS = {
    TOKEN: 'apoia_mcp_token_v1',
    BASE_URL: 'apoia_mcp_url_v1',
    HISTORY: 'apoia_mcp_history_v1',
    DRAWER_WIDTH: 'apoia_mcp_drawer_width_v1',
    THEME: 'apoia_mcp_theme_v1'
  };

  const THEMES = ['dark', 'light', 'sepia'];
  const THEME_LABELS = {
    dark: 'Modo Escuro',
    light: 'Modo Claro',
    sepia: 'Modo Sépia'
  };

  const ICONS = {
    justice: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    calculator: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/></svg>`,
    file: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    docText: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    key: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
    externalLink: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    play: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    copy: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    history: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 15"/></svg>`,
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    insert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
    refresh: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    
    // Ícones dos Modos de Tema
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    sepia: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h6"/></svg>`
  };

  // defaultArgs pré-preenche cada formulário com um exemplo funcional.
  const TOOL_META = {
    processMetadata: {
      category: 'processos',
      displayName: 'Metadados Processuais',
      defaultArgs: { processNumber: '0808047-41.2018.4.05.8109' }
    },
    piecesText: {
      category: 'processos',
      displayName: 'Texto de Peças Processuais',
      defaultArgs: { processNumber: '0808047-41.2018.4.05.8109', pieceIdArray: ['5c0b9c1e-2b3f-56a4-b9d0-d99567e1ebda'] }
    },
    libraryDocument: {
      category: 'processos',
      displayName: 'Documentos da Minha Biblioteca',
      helpNotice: 'Recupera o conteúdo de modelos, minutas, teses e documentos personalizados salvos na sua Biblioteca do Apoia PDPJ.',
      defaultArgs: { documentIdArray: [1] }
    },
    pangea: {
      category: 'jurisprudencia',
      displayName: 'Pangea (STF/STJ)',
      defaultArgs: { query: 'dano moral atraso voo', maxItems: 5 }
    },
    semanticSearch: {
      category: 'jurisprudencia',
      displayName: 'Busca Semântica / Híbrida',
      defaultArgs: { query: 'reajuste plano de saude faixa etaria', searchType: 'hybrid', limit: 5 }
    },
    precedent: {
      category: 'jurisprudencia',
      displayName: 'Precedentes Jurisprudenciais',
      defaultArgs: { searchQuery: 'dano moral in re ipsa E inscricao indevida', page: 1 }
    },
    leadingCaseSearch: {
      category: 'jurisprudencia',
      displayName: 'Leading Case (Paradigma)',
      defaultArgs: { numero: '1078' }
    },
    currentDate: {
      category: 'prazos',
      displayName: 'Data Atual Oficial',
      defaultArgs: {}
    },
    dateDiff: {
      category: 'prazos',
      displayName: 'Diferença de Prazos (Datas)',
      defaultArgs: { startDate: '10/01/2020', endDate: '14/08/2026' }
    },
    addDate: {
      category: 'prazos',
      displayName: 'Somar/Subtrair Prazos',
      defaultArgs: { startDate: '14/08/2026', dias: 15, meses: 0, anos: 0 }
    },
    calculator: {
      category: 'calculo',
      displayName: 'Calculadora de Expressões',
      defaultArgs: { items: [{ expression: '1500 * (1 + 0.01)^6' }] }
    }
  };

  // Textos explicativos exibidos ao lado do label oficial de cada campo (por nome de campo).
  // Cobrem os parâmetros técnicos/pouco intuitivos; campos sem entrada mostram a descrição do servidor.
  const FIELD_HELP = {
    sourceSlugs: 'Fontes: stf-rg (STF/Repercussão Geral) ou stj-rr (STJ/Repetitivos). Vazio = ambas.',
    searchType: 'hybrid = texto + sentido; vector = só similaridade semântica.',
    hybridAlpha: 'Só no modo híbrido: 0 = prioriza palavras exatas, 1 = prioriza sentido (0.5 = equilíbrio).',
    offset: 'Ponto de partida da paginação (0 = início).',
    maxItems: 'Corta a lista final neste número de itens.',
    debug: 'Inclui a resposta bruta do servidor (uso técnico).',
    orgaos: 'Tribunais a filtrar (ex.: STF, STJ, TST). Vazio = STF e STJ.',
    tipos: 'SUM (súmula), SV (vinculante), RG (repercussão geral), IAC, SIRDR, RR, CT.',
    includeOthers: 'Amplia a busca para órgãos além dos filtrados.',
    stripHtml: 'Remove marcações HTML do texto da tese.',
    searchQuery: 'Operadores: e, ou, não, aspas para expressão exata.',
    defaultVariables: 'Variáveis aplicadas a todos os cálculos do lote.'
  };

  // ==========================================
  // CLIENTE DE REDE MCP
  // ==========================================
  class McpClient {
    constructor() {
      this.initUrl();
    }

    initUrl() {
      let storedToken = GM_getValue(STORAGE_KEYS.TOKEN, '');
      let storedUrl = GM_getValue(STORAGE_KEYS.BASE_URL, '');

      this.token = storedToken || DEFAULT_TOKEN;
      this.baseUrl = storedUrl || DEFAULT_BASE_URL;

      if (!storedToken) GM_setValue(STORAGE_KEYS.TOKEN, this.token);
      if (!storedUrl) GM_setValue(STORAGE_KEYS.BASE_URL, this.baseUrl);
    }

    getFullUrl() {
      let cleanUrl = (this.baseUrl || DEFAULT_BASE_URL).trim();
      let cleanToken = (this.token || DEFAULT_TOKEN).trim();

      if (cleanToken.startsWith('http://') || cleanToken.startsWith('https://')) {
        return cleanToken;
      }

      if (cleanUrl.includes('?token=')) {
        return cleanUrl;
      }

      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}token=${cleanToken}`;
    }

    setCredentials(urlOrToken, optionalToken) {
      if (urlOrToken && (urlOrToken.startsWith('http://') || urlOrToken.startsWith('https://'))) {
        try {
          const parsed = new URL(urlOrToken);
          const tokenParam = parsed.searchParams.get('token');
          if (tokenParam) {
            this.token = tokenParam;
            parsed.searchParams.delete('token');
            this.baseUrl = parsed.toString().replace(/\?$/, '');
          } else {
            this.baseUrl = urlOrToken;
            if (optionalToken) this.token = optionalToken;
          }
        } catch (e) {
          this.baseUrl = urlOrToken;
          if (optionalToken) this.token = optionalToken;
        }
      } else if (urlOrToken) {
        this.token = urlOrToken;
      }
      GM_setValue(STORAGE_KEYS.BASE_URL, this.baseUrl);
      GM_setValue(STORAGE_KEYS.TOKEN, this.token);
    }

    normalizeToolArgs(name, rawArgs) {
      const args = { ...rawArgs };

      if (name === 'piecesText') {
        if (typeof args.pieceIdArray === 'string') {
          args.pieceIdArray = args.pieceIdArray.split(',').map(s => s.trim()).filter(Boolean);
        } else if (args.pieceIdArray && !Array.isArray(args.pieceIdArray)) {
          args.pieceIdArray = [String(args.pieceIdArray)];
        } else if (!args.pieceIdArray) {
          args.pieceIdArray = [];
        }
      }

      if (name === 'libraryDocument') {
        if (typeof args.documentIdArray === 'string') {
          args.documentIdArray = args.documentIdArray.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
        } else if (args.documentIdArray && !Array.isArray(args.documentIdArray)) {
          args.documentIdArray = [Number(args.documentIdArray)].filter(n => !isNaN(n));
        } else if (!args.documentIdArray) {
          args.documentIdArray = [];
        }
      }

      if (args.orgaos && typeof args.orgaos === 'string') {
        args.orgaos = args.orgaos.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (args.tipos && typeof args.tipos === 'string') {
        args.tipos = args.tipos.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (args.sourceSlugs && typeof args.sourceSlugs === 'string') {
        args.sourceSlugs = args.sourceSlugs.split(',').map(s => s.trim()).filter(Boolean);
      }

      return args;
    }

    sendRequest(method, params = {}) {
      return new Promise((resolve, reject) => {
        const targetUrl = this.getFullUrl();
        const payload = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: method,
          params: params
        };

        const postBody = JSON.stringify(payload);

        const handleResponseText = (status, text) => {
          if (status === 401) {
            return reject({
              isAuthError: true,
              status: 401,
              message: 'Token expirado ou inválido (HTTP 401). Renove seu token no Apoia PDPJ.'
            });
          }

          if (status < 200 || status >= 300) {
            return reject({
              status: status,
              message: `Erro HTTP ${status}: ${text || 'Falha na requisição ao servidor Apoia'}`
            });
          }

          try {
            let parsed = null;
            if (text.includes('data:')) {
              const lines = text.split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                  const jsonSub = trimmed.replace(/^data:\s*/, '').trim();
                  if (jsonSub) {
                    try {
                      parsed = JSON.parse(jsonSub);
                      break;
                    } catch (e) {}
                  }
                }
              }
            }

            if (!parsed) {
              parsed = JSON.parse(text);
            }

            if (parsed.error) {
              return reject({
                isRpcError: true,
                code: parsed.error.code,
                message: parsed.error.message || 'Erro retornado pelo servidor Apoia'
              });
            }

            if (parsed.result && parsed.result.isError) {
              const errContent = (parsed.result.content && parsed.result.content[0]?.text) || 'Erro de validação nos argumentos da ferramenta';
              return reject({
                isMcpToolError: true,
                message: errContent
              });
            }

            resolve(parsed.result);
          } catch (parseErr) {
            reject({
              message: `Falha ao processar resposta do servidor: ${parseErr.message}`,
              raw: text
            });
          }
        };

        if (typeof GM_xmlhttpRequest === 'function') {
          try {
            GM_xmlhttpRequest({
              method: 'POST',
              url: targetUrl,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
              },
              data: postBody,
              timeout: 60000,
              onload: (res) => handleResponseText(res.status, res.responseText),
              onerror: () => {
                this.fallbackFetch(targetUrl, postBody).then(resolve).catch(reject);
              },
              ontimeout: () => {
                reject({ message: 'Tempo limite excedido ao consultar o Apoia MCP (Timeout).' });
              }
            });
            return;
          } catch (e) {
            console.warn('[Apoia MCP] GM_xmlhttpRequest falhou, usando fetch fallback...', e);
          }
        }

        this.fallbackFetch(targetUrl, postBody).then(resolve).catch(reject);
      });
    }

    async fallbackFetch(targetUrl, postBody) {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: postBody
      });
      const text = await res.text();
      if (res.status === 401) {
        throw { isAuthError: true, status: 401, message: 'Token expirado ou inválido (HTTP 401).' };
      }
      if (!res.ok) {
        throw { status: res.status, message: `Erro HTTP ${res.status}: ${text}` };
      }
      
      let parsed = null;
      if (text.includes('data:')) {
        const line = text.split('\n').find(l => l.trim().startsWith('data:'));
        if (line) parsed = JSON.parse(line.replace(/^data:\s*/, '').trim());
      }
      if (!parsed) parsed = JSON.parse(text);
      if (parsed.result?.isError) {
        throw { isMcpToolError: true, message: parsed.result.content?.[0]?.text || 'Erro na ferramenta MCP' };
      }
      return parsed.result;
    }

    async listTools() {
      const res = await this.sendRequest('tools/list', {});
      return res?.tools || [];
    }

    async callTool(name, rawArgs) {
      const args = this.normalizeToolArgs(name, rawArgs);
      const startTime = performance.now();
      const res = await this.sendRequest('tools/call', {
        name: name,
        arguments: args
      });
      const durationMs = Math.round(performance.now() - startTime);

      let textContent = '';
      if (res && res.content && Array.isArray(res.content)) {
        textContent = res.content.map(c => c.text).join('\n');
      }

      let parsedObject = null;
      try {
        parsedObject = JSON.parse(textContent);
      } catch (e) {
        parsedObject = textContent;
      }

      return {
        raw: res,
        text: textContent,
        data: parsedObject,
        durationMs: durationMs
      };
    }
  }

  // ==========================================
  // ESTILOS VISUAIS E TEMAS
  // ==========================================
  const DRAWER_STYLES = `
    :host {
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      
      /* Modo Escuro Padrão */
      --bg-base: #111827;
      --bg-surface: #1f2937;
      --bg-surface-subtle: #182232;
      --bg-input: #0f172a;
      --bg-hover: #374151;
      --bg-header: #0f172a;
      --bg-token-bar: #1e293b;
      --bg-token-btn: #334155;
      --bg-card-selected: #1e293b;
      --bg-proc-item: #111827;
      --bg-doc-item: #1e293b;
      --bg-viewer: #0b1120;
      --bg-secondary-btn: #374151;
      --bg-preset: #0f172a;
      --bg-toast: #1e293b;
      --bg-prazo: #0f271c;
      --border-prazo: #059669;
      --text-prazo-val: #34d399;
      --text-prazo-desc: #a7f3d0;
      --border-color: #374151;
      --border-light: #4b5563;
      --border-focus: #3b82f6;
      --border-token-btn: #475569;
      --border-toast: #475569;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --text-label: #cbd5e1;
      --text-code: #cbd5e1;
      --primary: #1d4ed8;
      --primary-hover: #1e40af;
      --primary-accent: #93c5fd;
      --badge-court-bg: #1e3a5f;
      --badge-court-text: #93c5fd;
      --badge-court-border: #2563eb;
      --badge-type-bg: #334155;
      --badge-type-text: #e2e8f0;
      --badge-type-border: #475569;
      --badge-status-bg: #064e3b;
      --badge-status-text: #6ee7b7;
      --danger: #dc2626;
      --danger-bg: #450a0a;
      --danger-text: #fca5a5;
      --radius-sm: 4px;
      --radius-md: 6px;
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-main);
      box-sizing: border-box;
      z-index: 2147483647;
    }

    /* MODO CLARO */
    :host([data-theme="light"]), .apoia-drawer[data-theme="light"] {
      --bg-base: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-subtle: #f1f5f9;
      --bg-input: #ffffff;
      --bg-hover: #e2e8f0;
      --bg-header: #f1f5f9;
      --bg-token-bar: #e2e8f0;
      --bg-token-btn: #cbd5e1;
      --bg-card-selected: #eff6ff;
      --bg-proc-item: #f8fafc;
      --bg-doc-item: #f1f5f9;
      --bg-viewer: #ffffff;
      --bg-secondary-btn: #f1f5f9;
      --bg-preset: #f1f5f9;
      --bg-toast: #0f172a;
      --bg-prazo: #ecfdf5;
      --border-prazo: #a7f3d0;
      --text-prazo-val: #059669;
      --text-prazo-desc: #065f46;
      --border-color: #cbd5e1;
      --border-light: #94a3b8;
      --border-focus: #2563eb;
      --border-token-btn: #94a3b8;
      --border-toast: #334155;
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-dim: #64748b;
      --text-label: #334155;
      --text-code: #1e293b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --primary-accent: #1d4ed8;
      --badge-court-bg: #eff6ff;
      --badge-court-text: #1d4ed8;
      --badge-court-border: #bfdbfe;
      --badge-type-bg: #f1f5f9;
      --badge-type-text: #334155;
      --badge-type-border: #cbd5e1;
      --badge-status-bg: #d1fae5;
      --badge-status-text: #065f46;
      --danger: #dc2626;
      --danger-bg: #fef2f2;
      --danger-text: #991b1b;
    }

    /* MODO SÉPIA (LEITURA JURÍDICA / PAPEL) */
    :host([data-theme="sepia"]), .apoia-drawer[data-theme="sepia"] {
      --bg-base: #f7f1e3;
      --bg-surface: #efe6d2;
      --bg-surface-subtle: #e6dcbe;
      --bg-input: #fffcf5;
      --bg-hover: #dfd3b7;
      --bg-header: #e6dcbe;
      --bg-token-bar: #ded1b0;
      --bg-token-btn: #cfc19c;
      --bg-card-selected: #e8dbc0;
      --bg-proc-item: #fffcf5;
      --bg-doc-item: #f4ecdc;
      --bg-viewer: #fffcf5;
      --bg-secondary-btn: #e6dcbe;
      --bg-preset: #fffcf5;
      --bg-toast: #3e2d1d;
      --bg-prazo: #f1f8ee;
      --border-prazo: #a8d5a2;
      --text-prazo-val: #2b6e22;
      --text-prazo-desc: #1d4b17;
      --border-color: #d5c7a5;
      --border-light: #bfae87;
      --border-focus: #8b4513;
      --border-token-btn: #bfae87;
      --border-toast: #5e462e;
      --text-main: #3b2a1a;
      --text-muted: #6b533b;
      --text-dim: #8c7358;
      --text-label: #4a3520;
      --text-code: #2e1f13;
      --primary: #8b4513;
      --primary-hover: #70360c;
      --primary-accent: #8b4513;
      --badge-court-bg: #edd8b7;
      --badge-court-text: #663300;
      --badge-court-border: #d2a679;
      --badge-type-bg: #e8d6b8;
      --badge-type-text: #4a3525;
      --badge-type-border: #d2ba98;
      --badge-status-bg: #ddeed4;
      --badge-status-text: #25581b;
      --danger: #b91c1c;
      --danger-bg: #fdf2e9;
      --danger-text: #7f1d1d;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .apoia-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 2147483646;
    }

    .apoia-drawer-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .apoia-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 50vw;
      min-width: 520px;
      max-width: 95vw;
      background: var(--bg-base);
      border-left: 1px solid var(--border-color);
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.35);
      transform: translateX(100%);
      transition: transform 0.25s ease-out, background-color 0.2s ease, border-color 0.2s ease;
      display: flex;
      flex-direction: column;
      z-index: 2147483647;
      overflow: hidden;
      color: var(--text-main);
    }

    .apoia-drawer.open {
      transform: translateX(0);
    }

    .drawer-resizer {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      background: transparent;
      transition: background 0.15s ease;
      z-index: 10;
    }

    .drawer-resizer:hover, .drawer-resizer.resizing {
      background: var(--border-focus);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
    }

    .drawer-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      color: var(--primary-accent);
      display: flex;
      align-items: center;
    }

    .title-text {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: 0.2px;
    }

    .title-badge {
      font-size: 10px;
      font-weight: 600;
      background: var(--bg-token-bar);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 1px 6px;
      border-radius: 3px;
    }

    .drawer-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-icon {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-icon:hover {
      background: var(--bg-hover);
      color: var(--text-main);
    }

    .btn-icon.active {
      background: var(--badge-court-bg);
      color: var(--primary-accent);
      border-color: var(--badge-court-border);
    }

    .token-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-token-bar);
      border-bottom: 1px solid var(--border-color);
      padding: 8px 16px;
      font-size: 12px;
    }

    .token-bar.expired {
      background: var(--danger-bg);
      border-bottom-color: var(--danger);
    }

    .token-bar-status {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
    }

    .token-bar.expired .token-bar-status {
      color: var(--danger-text);
    }

    .token-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-token-btn);
      color: var(--text-main);
      border: 1px solid var(--border-token-btn);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-size: 11.5px;
      font-weight: 600;
      transition: background 0.15s ease;
    }

    .token-link-btn:hover {
      background: var(--bg-hover);
    }

    .drawer-nav {
      display: flex;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      padding: 0 12px;
      overflow-x: auto;
    }

    .nav-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 9px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .nav-tab:hover {
      color: var(--text-main);
    }

    .nav-tab.active {
      color: var(--text-main);
      border-bottom-color: var(--primary);
      background: var(--bg-hover);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 7px 10px;
    }

    .search-box input {
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-main);
      font-size: 12.5px;
      width: 100%;
    }

    .search-box input::placeholder {
      color: var(--text-dim);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    .tool-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tool-card:hover {
      border-color: var(--border-light);
      background: var(--bg-hover);
    }

    .tool-card.selected {
      border-color: var(--primary);
      background: var(--bg-card-selected);
      box-shadow: inset 0 0 0 1px var(--primary);
    }

    .tool-card-title {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tool-card-desc {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .runner-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .runner-head {
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .runner-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .runner-desc {
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .info-notice {
      background: var(--bg-surface-subtle);
      border: 1px solid var(--primary);
      border-left: 3px solid var(--primary);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      font-size: 11.5px;
      color: var(--text-main);
      line-height: 1.45;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .form-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-label);
      display: flex;
      justify-content: space-between;
    }

    .form-label .req {
      color: var(--danger);
      margin-left: 2px;
    }

    .form-label-help {
      font-weight: 400;
      color: var(--text-dim);
      font-size: 10.5px;
    }

    .form-control {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-family: inherit;
      font-size: 12.5px;
      padding: 7px 9px;
      outline: none;
      transition: border-color 0.15s ease;
      width: 100%;
    }

    .form-control:focus {
      border-color: var(--border-focus);
    }

    .form-control.input-error {
      border-color: var(--danger) !important;
      background: var(--danger-bg);
    }

    textarea.form-control {
      min-height: 64px;
      resize: vertical;
    }

    .form-hint {
      font-size: 10.5px;
      color: var(--text-dim);
    }

    .preset-btn {
      background: var(--bg-preset);
      border: 1px solid var(--border-color);
      color: var(--primary-accent);
      font-size: 10.5px;
      padding: 2px 7px;
      border-radius: 3px;
      cursor: pointer;
    }

    .preset-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-light);
    }

    .runner-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      user-select: none;
    }

    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--bg-secondary-btn);
      color: var(--text-main);
      border-color: var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-hover);
    }

    .btn-small {
      padding: 3px 8px;
      font-size: 11px;
    }

    .results-box {
      background: var(--bg-surface-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-top: 8px;
    }

    .results-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
    }

    .results-meta {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .results-time {
      font-size: 10.5px;
      color: var(--primary-accent);
      font-family: var(--font-mono);
    }

    .results-tabs {
      display: flex;
      gap: 2px;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 7px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .tab-btn.active {
      background: var(--bg-surface);
      color: var(--text-main);
      border-color: var(--border-color);
    }

    .results-content {
      padding: 12px;
      max-height: 540px;
      overflow-y: auto;
    }

    .error-card {
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      border-radius: var(--radius-sm);
      padding: 12px;
      color: var(--danger-text);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .error-card-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--danger-text);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-card-body {
      font-size: 11.5px;
      line-height: 1.4;
      white-space: pre-wrap;
      font-family: var(--font-mono);
      background: rgba(0,0,0,0.08);
      padding: 6px 8px;
      border-radius: 3px;
    }

    .juris-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .juris-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .badge-court {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--badge-court-bg);
      color: var(--badge-court-text);
      border: 1px solid var(--badge-court-border);
    }

    .badge-type {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--badge-type-bg);
      color: var(--badge-type-text);
      border: 1px solid var(--badge-type-border);
    }

    .badge-status {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--badge-status-bg);
      color: var(--badge-status-text);
    }

    .juris-tese {
      font-size: 12px;
      color: var(--text-main);
      line-height: 1.45;
      font-weight: 500;
    }

    .juris-questao {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
      background: var(--bg-proc-item);
      padding: 5px 8px;
      border-radius: 3px;
      border-left: 2px solid var(--primary);
    }

    .juris-links {
      display: flex;
      gap: 8px;
      font-size: 11px;
      margin-top: 2px;
    }

    .juris-links a {
      color: var(--primary-accent);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .juris-links a:hover {
      text-decoration: underline;
    }

    .proc-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .proc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }

    .proc-num {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary-accent);
      font-family: var(--font-mono);
    }

    .proc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 11.5px;
    }

    .proc-item {
      background: var(--bg-proc-item);
      border: 1px solid var(--border-color);
      border-radius: 3px;
      padding: 6px 8px;
    }

    .proc-item-label {
      font-size: 10px;
      color: var(--text-dim);
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .proc-item-val {
      color: var(--text-main);
      font-weight: 500;
    }

    .proc-parties {
      background: var(--bg-proc-item);
      border: 1px solid var(--border-color);
      border-radius: 3px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11.5px;
    }

    .proc-movs-container {
      margin-top: 4px;
      border-top: 1px solid var(--border-color);
      padding-top: 8px;
    }

    .proc-movs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .proc-movs-filter {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 3px;
      color: var(--text-main);
      font-size: 11px;
      padding: 3px 6px;
      width: 160px;
      outline: none;
    }

    .proc-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 380px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .timeline-event {
      background: var(--bg-proc-item);
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--primary);
      border-radius: 3px;
      padding: 8px 10px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-date {
      font-size: 10px;
      color: var(--primary-accent);
      font-family: var(--font-mono);
    }

    .timeline-desc {
      color: var(--text-main);
      font-weight: 500;
    }

    .timeline-docs {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
      border-top: 1px dashed var(--border-color);
      padding-top: 4px;
    }

    .doc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-doc-item);
      border: 1px solid var(--border-color);
      padding: 4px 8px;
      border-radius: 3px;
      gap: 6px;
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-main);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-btn-view {
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 3px;
      padding: 2px 7px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      transition: background 0.15s ease;
    }

    .doc-btn-view:hover {
      background: var(--primary-hover);
    }

    .piece-viewer-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      z-index: 20;
      padding: 16px;
    }

    .piece-viewer-modal {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .piece-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
    }

    .piece-viewer-body {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      background: var(--bg-viewer);
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 12.5px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .piece-viewer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      padding: 8px 12px;
      background: var(--bg-header);
      border-top: 1px solid var(--border-color);
    }

    .prazo-display {
      background: var(--bg-prazo);
      border: 1px solid var(--border-prazo);
      border-radius: var(--radius-sm);
      padding: 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .prazo-val {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-prazo-val);
      font-family: var(--font-mono);
    }

    .prazo-desc {
      font-size: 11.5px;
      color: var(--text-prazo-desc);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table th, .data-table td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      color: var(--text-muted);
      font-weight: 600;
    }

    .code-view {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-code);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.4;
    }

    .results-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding: 8px 12px;
      background: var(--bg-header);
      border-top: 1px solid var(--border-color);
    }

    .settings-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toast {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-toast);
      color: #ffffff;
      border: 1px solid var(--border-toast);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 2147483647;
    }

    .toast.show {
      opacity: 1;
    }

    .loader {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(150, 150, 150, 0.3);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // ==========================================
  // INTERFACE PRINCIPAL
  // ==========================================
  class ApoiaMcpUI {
    constructor(client) {
      this.client = client;
      this.isOpen = false;
      this.currentTab = 'all';
      this.selectedTool = null;
      this.tools = [];
      this.lastResult = null;
      this.currentResultView = 'visual';
      this.history = GM_getValue(STORAGE_KEYS.HISTORY, []);
      this.currentLoadedPieceText = '';
      this.currentTheme = GM_getValue(STORAGE_KEYS.THEME, 'dark');

      this.initDom();
      this.registerEvents();
      this.applyTheme(this.currentTheme, false);
      this.loadTools();
    }

    initDom() {
      this.host = document.createElement('div');
      this.host.id = 'apoia-mcp-assistant-root';
      this.shadow = this.host.attachShadow({ mode: 'open' });

      const styleEl = document.createElement('style');
      styleEl.textContent = DRAWER_STYLES;
      this.shadow.appendChild(styleEl);

      const savedWidth = GM_getValue(STORAGE_KEYS.DRAWER_WIDTH, '50vw');

      this.container = document.createElement('div');
      this.container.innerHTML = `
        <!-- Backdrop -->
        <div class="apoia-drawer-backdrop" id="drawerBackdrop"></div>

        <!-- Drawer Lateral (Acionado exclusivamente por Alt + M) -->
        <div class="apoia-drawer" id="drawer" style="width: ${savedWidth};" data-theme="${this.currentTheme}">
          <div class="drawer-resizer" id="drawerResizer" title="Arraste para redimensionar o painel"></div>

          <div class="drawer-header">
            <div class="drawer-title-group">
              <div class="title-icon">${ICONS.justice}</div>
              <div class="title-text">Apoia MCP</div>
              <span class="title-badge">Alt + M</span>
            </div>
            <div class="drawer-actions">
              <button class="btn-icon" id="btnThemeToggle" title="Alterar Tema: Escuro / Claro / Sépia">${ICONS.moon}</button>
              <button class="btn-icon" id="btnSettings" title="Configurações de Token">${ICONS.settings}</button>
              <button class="btn-icon" id="btnHistory" title="Histórico de Consultas">${ICONS.history}</button>
              <button class="btn-icon" id="btnClose" title="Fechar (Esc)">${ICONS.x}</button>
            </div>
          </div>

          <div class="token-bar" id="tokenBar">
            <div class="token-bar-status">
              ${ICONS.key}
              <span id="tokenStatusText">Conectado ao Apoia MCP</span>
            </div>
            <a href="${TOKEN_PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="token-link-btn" title="Abre a página oficial para gerar ou renovar seu token de acesso">
              Renovar Token ${ICONS.externalLink}
            </a>
          </div>

          <div class="drawer-nav" id="drawerNav">
            <button class="nav-tab active" data-tab="all">Todas</button>
            <button class="nav-tab" data-tab="processos">Processos & Peças</button>
            <button class="nav-tab" data-tab="jurisprudencia">Jurisprudência</button>
            <button class="nav-tab" data-tab="prazos">Prazos & Datas</button>
            <button class="nav-tab" data-tab="calculo">Cálculos</button>
          </div>

          <div class="drawer-body" id="drawerBody">
            <div class="search-box">
              ${ICONS.search}
              <input type="text" id="toolSearchInput" placeholder="Filtrar ferramentas..." />
            </div>

            <div class="tools-grid" id="toolsGrid"></div>

            <div class="runner-panel" id="runnerPanel" style="display: none;">
              <div class="runner-head">
                <div class="runner-title" id="runnerTitle">Ferramenta</div>
                <div class="runner-desc" id="runnerDesc"></div>
              </div>

              <div id="dynamicNoticeContainer"></div>
              <div id="dynamicFormContainer"></div>

              <div class="runner-buttons">
                <button class="btn btn-primary" id="btnExecute">
                  ${ICONS.play} Executar
                </button>
                <button class="btn btn-secondary" id="btnResetForm">
                  Restaurar Padrão
                </button>
              </div>

              <!-- Bloco de Resultados Embutido no Runner -->
              <div class="results-box" id="resultsBox" style="display: none;">
                <div class="results-box-header">
                  <div class="results-meta">
                    Resultado <span class="results-time" id="resultsTime"></span>
                  </div>
                  <div class="results-tabs">
                    <button class="tab-btn active" data-view="visual">Visual</button>
                    <button class="tab-btn" data-view="markdown">Markdown</button>
                    <button class="tab-btn" data-view="json">JSON</button>
                  </div>
                </div>
                <div class="results-content" id="resultsContent"></div>
                <div class="results-footer">
                  <button class="btn btn-secondary" id="btnInsertCursor" title="Insere o resultado diretamente no campo de texto ativo onde estiver o cursor na página">
                    ${ICONS.insert} Inserir no Cursor
                  </button>
                  <button class="btn btn-secondary" id="btnCopyResult">
                    ${ICONS.copy} Copiar
                  </button>
                </div>
              </div>
            </div>

            <div class="settings-box" id="settingsPanel" style="display: none;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">Configuração do Apoia MCP</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Informe seu token temporário obtido no portal Apoia.</div>

              <div class="form-group">
                <label class="form-label">Token ou URL MCP Completa:</label>
                <input type="text" class="form-control" id="cfgTokenInput" placeholder="Cole o token ou a URL completa com ?token=" />
                <span class="form-hint">Obtenha seu token em: <a href="${TOKEN_PORTAL_URL}" target="_blank" style="color: var(--primary-accent);">${TOKEN_PORTAL_URL}</a></span>
              </div>

              <div class="form-group">
                <label class="form-label">URL Base do Endpoint:</label>
                <input type="text" class="form-control" id="cfgUrlInput" value="${DEFAULT_BASE_URL}" />
              </div>

              <div class="form-group">
                <label class="form-label">Tema Visual da Interface:</label>
                <select class="form-control" id="cfgThemeSelect">
                  <option value="dark">Modo Escuro</option>
                  <option value="light">Modo Claro</option>
                  <option value="sepia">Modo Sépia (Leitura Confortável)</option>
                </select>
              </div>

              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button class="btn btn-primary" id="btnSaveConfig">${ICONS.check} Salvar</button>
                <button class="btn btn-secondary" id="btnTestConfig">${ICONS.refresh} Testar Conexão</button>
              </div>
            </div>

            <div class="settings-box" id="historyPanel" style="display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Histórico de Consultas</div>
                <button class="btn btn-secondary" id="btnClearHistory" style="padding: 3px 6px; font-size: 11px;">Limpar</button>
              </div>
              <div id="historyList" style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;"></div>
            </div>
          </div>

          <!-- Visualizador Modal de Peça Processual -->
          <div class="piece-viewer-overlay" id="pieceViewerOverlay" style="display: none;">
            <div class="piece-viewer-modal">
              <div class="piece-viewer-header">
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: var(--text-main);" id="pieceViewerTitle">Conteúdo da Peça</div>
                  <div style="font-size: 11px; color: var(--text-muted);" id="pieceViewerSub">Processo</div>
                </div>
                <button class="btn-icon" id="btnClosePieceViewer">${ICONS.x}</button>
              </div>
              <div class="piece-viewer-body" id="pieceViewerBody">Carregando conteúdo...</div>
              <div class="piece-viewer-footer">
                <button class="btn btn-secondary btn-small" id="btnInsertPieceCursor">${ICONS.insert} Inserir no Cursor</button>
                <button class="btn btn-secondary btn-small" id="btnCopyPieceText">${ICONS.copy} Copiar Texto</button>
              </div>
            </div>
          </div>
        </div>

        <div class="toast" id="toastMsg">${ICONS.check} <span id="toastText"></span></div>
      `;

      this.shadow.appendChild(this.container);
      document.documentElement.appendChild(this.host);
      this.initResizeHandle();
    }

    initResizeHandle() {
      const resizer = this.shadow.getElementById('drawerResizer');
      const drawer = this.shadow.getElementById('drawer');
      let isResizing = false;

      resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.userSelect = 'none';

        const onMouseMove = (ev) => {
          if (!isResizing) return;
          const newWidth = window.innerWidth - ev.clientX;
          if (newWidth >= 400 && newWidth <= window.innerWidth * 0.95) {
            drawer.style.width = `${newWidth}px`;
          }
        };

        const onMouseUp = () => {
          if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.userSelect = '';
            GM_setValue(STORAGE_KEYS.DRAWER_WIDTH, drawer.style.width);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    applyTheme(themeName, showToastMsg = true) {
      if (!THEMES.includes(themeName)) themeName = 'dark';
      this.currentTheme = themeName;
      GM_setValue(STORAGE_KEYS.THEME, themeName);

      this.host.setAttribute('data-theme', themeName);
      const drawer = this.shadow.getElementById('drawer');
      if (drawer) drawer.setAttribute('data-theme', themeName);

      const btn = this.shadow.getElementById('btnThemeToggle');
      const themeSelect = this.shadow.getElementById('cfgThemeSelect');
      if (themeSelect) themeSelect.value = themeName;

      if (btn) {
        if (themeName === 'dark') {
          btn.innerHTML = ICONS.moon;
          btn.title = `Tema Atual: Modo Escuro (Clique para Modo Claro)`;
        } else if (themeName === 'light') {
          btn.innerHTML = ICONS.sun;
          btn.title = `Tema Atual: Modo Claro (Clique para Modo Sépia)`;
        } else if (themeName === 'sepia') {
          btn.innerHTML = ICONS.sepia;
          btn.title = `Tema Atual: Modo Sépia (Clique para Modo Escuro)`;
        }
      }

      if (showToastMsg) {
        this.showToast(`Tema alterado para ${THEME_LABELS[themeName]}`);
      }
    }

    cycleTheme() {
      const currentIndex = THEMES.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      this.applyTheme(THEMES[nextIndex], true);
    }

    showToast(msg) {
      const toast = this.shadow.getElementById('toastMsg');
      const toastText = this.shadow.getElementById('toastText');
      toastText.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2400);
    }

    toggleDrawer(open) {
      this.isOpen = typeof open === 'boolean' ? open : !this.isOpen;
      const drawer = this.shadow.getElementById('drawer');
      const backdrop = this.shadow.getElementById('drawerBackdrop');

      if (this.isOpen) {
        drawer.classList.add('open');
        backdrop.classList.add('open');
      } else {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        this.closePieceViewer();
      }
    }

    async loadTools() {
      try {
        const rawTools = await this.client.listTools();
        this.tools = rawTools;
        this.renderToolsGrid();
        this.updateTokenStatus(true);
      } catch (err) {
        console.warn('[Apoia MCP] Erro ao carregar ferramentas:', err);
        this.updateTokenStatus(false, err.message || 'Token expirado ou inválido.');
      }
    }

    updateTokenStatus(isValid, msg) {
      const bar = this.shadow.getElementById('tokenBar');
      const text = this.shadow.getElementById('tokenStatusText');

      if (isValid) {
        bar.classList.remove('expired');
        text.textContent = 'Conectado ao Apoia MCP';
      } else {
        bar.classList.add('expired');
        text.textContent = msg || 'Token expirado ou inválido';
      }
    }

    renderToolsGrid(filterText = '') {
      const grid = this.shadow.getElementById('toolsGrid');
      grid.innerHTML = '';
      const search = filterText.toLowerCase().trim();

      const filtered = this.tools.filter(tool => {
        const meta = TOOL_META[tool.name] || {};
        const matchCategory = this.currentTab === 'all' || meta.category === this.currentTab;
        const matchSearch = !search ||
          tool.name.toLowerCase().includes(search) ||
          (tool.description && tool.description.toLowerCase().includes(search)) ||
          (meta.displayName && meta.displayName.toLowerCase().includes(search));

        return matchCategory && matchSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 16px;">Nenhuma ferramenta encontrada.</div>`;
        return;
      }

      filtered.forEach(tool => {
        const meta = TOOL_META[tool.name] || { displayName: tool.name };
        const card = document.createElement('div');
        card.className = `tool-card ${this.selectedTool?.name === tool.name ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="tool-card-title">${meta.displayName || tool.name}</div>
          <div class="tool-card-desc">${tool.description || 'Sem descrição.'}</div>
        `;

        card.addEventListener('click', () => this.selectTool(tool));
        grid.appendChild(card);
      });
    }

    selectTool(tool) {
      this.selectedTool = tool;
      this.renderToolsGrid(this.shadow.getElementById('toolSearchInput').value);

      const runnerPanel = this.shadow.getElementById('runnerPanel');
      const runnerTitle = this.shadow.getElementById('runnerTitle');
      const runnerDesc = this.shadow.getElementById('runnerDesc');
      const noticeContainer = this.shadow.getElementById('dynamicNoticeContainer');
      const meta = TOOL_META[tool.name] || {};

      runnerPanel.style.display = 'flex';
      runnerTitle.textContent = meta.displayName || tool.name;
      runnerDesc.textContent = tool.description || '';

      if (meta.helpNotice) {
        noticeContainer.innerHTML = `
          <div class="info-notice">
            <div>${meta.helpNotice}</div>
            <div>
              <a href="${LIBRARY_PORTAL_URL}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-accent); font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
                Acessar Portal Apoia PDPJ ${ICONS.externalLink}
              </a>
            </div>
          </div>
        `;
      } else {
        noticeContainer.innerHTML = '';
      }

      this.renderDynamicForm(tool);
      this.shadow.getElementById('resultsBox').style.display = 'none';
      runnerPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderDynamicForm(tool) {
      const container = this.shadow.getElementById('dynamicFormContainer');
      container.innerHTML = '';

      const schema = tool.inputSchema || {};
      const properties = schema.properties || {};
      const required = schema.required || [];
      const meta = TOOL_META[tool.name] || {};

      if (Object.keys(properties).length === 0) {
        const noParams = document.createElement('div');
        noParams.style.cssText = 'font-size: 11.5px; color: var(--text-dim); font-style: italic; padding: 4px 0;';
        noParams.textContent = 'Esta ferramenta não requer parâmetros de entrada.';
        container.appendChild(noParams);
        return;
      }

      for (const [key, prop] of Object.entries(properties)) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        const isReq = required.includes(key);
        const fieldHelp = FIELD_HELP[key];
        label.innerHTML = `<span>${key}${isReq ? ' <span class="req">*</span>' : ''}${fieldHelp ? ` <span class="form-label-help">· ${this.escapeHtml(fieldHelp)}</span>` : ''}</span>`;
        group.appendChild(label);

        let placeholder = prop.description || '';
        if (key === 'documentIdArray') {
          placeholder = 'IDs numéricos dos seus documentos salvos na Biblioteca (ex: 1, 2, 10)';
        } else if (key === 'pieceIdArray') {
          placeholder = 'Identificadores das peças processuais (ex: 5c0b9c1e-2b3f-56a4-b9d0-d99567e1ebda)';
        } else if (key === 'orgaos') {
          placeholder = 'Órgãos separados por vírgula (ex: STF, STJ, TST)';
        }

        if (prop.type === 'string' && (key.toLowerCase().includes('query') || key.toLowerCase().includes('expression') || (prop.maxLength && prop.maxLength > 100))) {
          const textarea = document.createElement('textarea');
          textarea.className = 'form-control';
          textarea.name = key;
          textarea.placeholder = placeholder;
          if (prop.default) textarea.value = prop.default;
          group.appendChild(textarea);
        } else if (prop.enum && Array.isArray(prop.enum)) {
          const select = document.createElement('select');
          select.className = 'form-control';
          select.name = key;
          prop.enum.forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = opt;
            if (prop.default === opt) optEl.selected = true;
            select.appendChild(optEl);
          });
          group.appendChild(select);
        } else if (prop.type === 'boolean') {
          const select = document.createElement('select');
          select.className = 'form-control';
          select.name = key;
          select.innerHTML = `
            <option value="false">Não (false)</option>
            <option value="true">Sim (true)</option>
          `;
          if (prop.default === true) select.value = 'true';
          group.appendChild(select);
        } else if (prop.type === 'integer' || prop.type === 'number') {
          const input = document.createElement('input');
          input.type = 'number';
          input.className = 'form-control';
          input.name = key;
          if (prop.minimum !== undefined) input.min = prop.minimum;
          if (prop.maximum !== undefined) input.max = prop.maximum;
          if (prop.default !== undefined) input.value = prop.default;
          input.placeholder = placeholder;
          group.appendChild(input);
        } else if (prop.type === 'array') {
          if (tool.name === 'calculator' && key === 'items') {
            const textarea = document.createElement('textarea');
            textarea.className = 'form-control';
            textarea.name = key;
            textarea.rows = 2;
            textarea.placeholder = 'Expressão (ex.: 1500 * (1 + 0.01)^6)';
            textarea.dataset.isCalculatorItems = 'true';
            group.appendChild(textarea);
          } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.name = key;
            input.placeholder = placeholder;
            input.dataset.isArray = 'true';
            group.appendChild(input);
          }
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'form-control';
          input.name = key;
          if (prop.default) input.value = prop.default;
          input.placeholder = placeholder;
          group.appendChild(input);
        }

        if (prop.description && key !== 'documentIdArray' && key !== 'pieceIdArray' && !FIELD_HELP[key]) {
          const hint = document.createElement('span');
          hint.className = 'form-hint';
          hint.textContent = prop.description;
          group.appendChild(hint);
        }

        container.appendChild(group);
      }

      if (meta.defaultArgs) {
        this.populateFormValues(meta.defaultArgs);
      }
    }

    populateFormValues(args) {
      const container = this.shadow.getElementById('dynamicFormContainer');
      for (const [key, value] of Object.entries(args)) {
        const el = container.querySelector(`[name="${key}"]`);
        if (!el) continue;

        if (el.dataset.isCalculatorItems) {
          if (Array.isArray(value) && value[0]?.expression) {
            el.value = value[0].expression;
          } else {
            el.value = typeof value === 'object' ? JSON.stringify(value) : value;
          }
        } else if (el.dataset.isArray && Array.isArray(value)) {
          el.value = value.join(', ');
        } else {
          el.value = value;
        }
      }
    }

    getFormValues() {
      const container = this.shadow.getElementById('dynamicFormContainer');
      const inputs = container.querySelectorAll('[name]');
      const args = {};

      inputs.forEach(el => {
        el.classList.remove('input-error');
        const key = el.name;
        let val = el.value.trim();
        if (val === '') return;

        if (el.dataset.isCalculatorItems) {
          try {
            if (val.startsWith('[')) {
              args[key] = JSON.parse(val);
            } else {
              args[key] = [{ expression: val }];
            }
          } catch (e) {
            args[key] = [{ expression: val }];
          }
        } else if (el.dataset.isArray) {
          args[key] = val.split(',').map(s => s.trim()).filter(Boolean);
        } else if (el.type === 'number') {
          args[key] = Number(val);
        } else if (el.value === 'true' || el.value === 'false') {
          args[key] = el.value === 'true';
        } else {
          args[key] = val;
        }
      });

      return args;
    }

    validateForm() {
      if (!this.selectedTool) return true;
      const schema = this.selectedTool.inputSchema || {};
      const required = schema.required || [];
      const container = this.shadow.getElementById('dynamicFormContainer');
      let isValid = true;

      for (const reqKey of required) {
        const el = container.querySelector(`[name="${reqKey}"]`);
        if (el && !el.value.trim()) {
          el.classList.add('input-error');
          el.focus();
          this.showToast(`Preencha o campo obrigatório: ${reqKey}`);
          isValid = false;
          break;
        }
      }

      return isValid;
    }

    async executeCurrentTool() {
      if (!this.selectedTool) return;
      if (!this.validateForm()) return;

      const btn = this.shadow.getElementById('btnExecute');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<div class="loader"></div> Executando...`;

      const resultsBox = this.shadow.getElementById('resultsBox');
      const resultsContent = this.shadow.getElementById('resultsContent');
      const resultsTime = this.shadow.getElementById('resultsTime');

      resultsBox.style.display = 'flex';
      resultsContent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--text-muted);"><div class="loader"></div> Processando requisição no Apoia MCP...</div>`;

      resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
        const args = this.getFormValues();
        const res = await this.client.callTool(this.selectedTool.name, args);
        this.lastResult = res;

        resultsTime.textContent = `${res.durationMs}ms`;
        this.renderResultView();
        this.saveToHistory(this.selectedTool.name, args, res);
        resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        console.error('[Apoia MCP] Falha na execução:', err);
        resultsTime.textContent = 'Erro';

        if (err.isAuthError) {
          this.updateTokenStatus(false, 'Token expirado ou inválido (401)');
          resultsContent.innerHTML = `
            <div class="error-card">
              <div class="error-card-title">${ICONS.alert} Token expirado ou não autorizado</div>
              <div class="error-card-body">Seu token expirou ou não está autorizado. Obtenha um novo token no portal do Apoia.</div>
              <div style="margin-top: 4px;"><a href="${TOKEN_PORTAL_URL}" target="_blank" class="token-link-btn">Acessar Portal Apoia para Renovar Token ${ICONS.externalLink}</a></div>
            </div>
          `;
        } else {
          const info = this.interpretServiceError(err.message || 'Falha ao executar ferramenta no servidor Apoia');
          resultsContent.innerHTML = `
            <div class="error-card">
              <div class="error-card-title">${ICONS.alert} ${this.escapeHtml(info.title)}</div>
              <div class="error-card-body">${this.escapeHtml(info.body)}</div>
            </div>
          `;
          this.appendRetryButton(resultsContent, () => this.executeCurrentTool());
        }
        resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    // Traduz erros técnicos repassados pelo Apoia em mensagens amigáveis.
    interpretServiceError(raw) {
      const t = String(raw || '');
      if (/fetch failed|failed to search|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|socket hang up|502|503|504/i.test(t)) {
        return {
          title: 'Serviço indisponível no momento',
          body: 'O Apoia não conseguiu se conectar ao serviço de dados (falha de conexão do lado do servidor, não da sua busca). Costuma ser temporário — tente novamente em instantes.'
        };
      }
      if (/n[ãa]o foi poss[ií]vel encontrar|not found|nenhum resultado/i.test(t)) {
        return { title: 'Nada encontrado', body: t };
      }
      return { title: 'Erro retornado pelo serviço', body: t };
    }

    renderResultView() {
      if (!this.lastResult) return;
      const body = this.shadow.getElementById('resultsContent');
      const toolName = this.selectedTool?.name;
      const data = this.lastResult.data;

      if (data && (data.status === 'ERROR' || data.error)) {
        const info = this.interpretServiceError(data.error || JSON.stringify(data));
        body.innerHTML = `
          <div class="error-card">
            <div class="error-card-title">${ICONS.alert} ${this.escapeHtml(info.title)}</div>
            <div class="error-card-body">${this.escapeHtml(info.body)}</div>
          </div>
        `;
        this.appendRetryButton(body, () => this.executeCurrentTool());
        return;
      }

      if (this.currentResultView === 'json') {
        body.innerHTML = `<pre class="code-view">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
        return;
      }

      if (this.currentResultView === 'markdown') {
        const md = this.convertToMarkdown(toolName, data);
        body.innerHTML = `<pre class="code-view" style="font-family: var(--font-sans); font-size: 12px;">${this.escapeHtml(md)}</pre>`;
        return;
      }

      // Visual Formatada
      body.innerHTML = '';
      if (toolName === 'processMetadata') {
        this.renderProcessMetadata(body, data);
      } else if (toolName === 'piecesText') {
        this.renderPiecesText(body, data);
      } else if (toolName === 'libraryDocument') {
        this.renderLibraryDocument(body, data);
      } else if (toolName === 'pangea' || toolName === 'semanticSearch' || toolName === 'precedent' || toolName === 'leadingCaseSearch') {
        this.renderJurisprudenceCards(body, data);
      } else if (toolName === 'dateDiff' || toolName === 'addDate' || toolName === 'currentDate') {
        this.renderDateResult(body, toolName, data);
      } else if (toolName === 'calculator') {
        this.renderCalculatorResult(body, data);
      } else {
        this.renderGenericData(body, data);
      }
    }

    renderProcessMetadata(container, data) {
      const list = Array.isArray(data) ? data : [data];
      if (list.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 16px;">Nenhum metadado processual encontrado.</div>`;
        return;
      }

      list.forEach(proc => {
        const card = document.createElement('div');
        card.className = 'proc-card';

        const num = proc.numeroProcesso || 'Processo sem número';
        const tribunal = proc.tribunal?.sigla ? `${proc.tribunal.sigla} (${proc.tribunal.nome || ''})` : 'Tribunal não informado';
        const instancia = proc.instancia ? proc.instancia.replace(/_/g, ' ') : '';
        const classe = proc.classe?.descricao ? `${proc.classe.descricao} (Cód. ${proc.classe.codigo})` : 'Não informada';
        const assunto = proc.assuntos && proc.assuntos.length > 0 ? proc.assuntos.map(a => a.descricao).join(', ') : 'Não informado';
        
        let valorCausa = 'Não informado';
        if (proc.informacoesGerais?.valorAcao !== undefined) {
          valorCausa = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.informacoesGerais.valorAcao);
        }

        let ajuizamento = 'Não informada';
        if (proc.informacoesGerais?.dataAjuizamento) {
          try {
            ajuizamento = new Date(proc.informacoesGerais.dataAjuizamento).toLocaleDateString('pt-BR');
          } catch(e) {
            ajuizamento = proc.informacoesGerais.dataAjuizamento;
          }
        }

        const ativo = proc.partes?.poloAtivo && proc.partes.poloAtivo.length > 0
          ? proc.partes.poloAtivo.map(p => `<strong>${p.tipo || 'AUTOR'}:</strong> ${p.nome}`).join('<br>')
          : 'Polo ativo não detalhado';

        const passivo = proc.partes?.poloPassivo && proc.partes.poloPassivo.length > 0
          ? proc.partes.poloPassivo.map(p => `<strong>${p.tipo || 'RÉU'}:</strong> ${p.nome}`).join('<br>')
          : 'Polo passivo não detalhado';

        const allMovs = proc.movimentosEDocumentos || [];

        card.innerHTML = `
          <div class="proc-header">
            <div>
              <div class="proc-num">${num}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${tribunal} · ${instancia}</div>
            </div>
            <span class="badge-court">${proc.tribunal?.sigla || 'JUDICIAL'}</span>
          </div>

          <div class="proc-grid">
            <div class="proc-item">
              <div class="proc-item-label">Classe Processual</div>
              <div class="proc-item-val">${classe}</div>
            </div>
            <div class="proc-item">
              <div class="proc-item-label">Assunto Principal</div>
              <div class="proc-item-val">${assunto}</div>
            </div>
            <div class="proc-item">
              <div class="proc-item-label">Valor da Causa</div>
              <div class="proc-item-val" style="color: var(--text-prazo-val); font-family: var(--font-mono);">${valorCausa}</div>
            </div>
            <div class="proc-item">
              <div class="proc-item-label">Data de Ajuizamento</div>
              <div class="proc-item-val">${ajuizamento}</div>
            </div>
          </div>

          <div class="proc-parties">
            <div>${ativo}</div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 4px; margin-top: 2px;">${passivo}</div>
          </div>

          <div class="proc-movs-container">
            <div class="proc-movs-header">
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-main);">
                Movimentações & Peças (${allMovs.length})
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <input type="text" class="proc-movs-filter" placeholder="Filtrar eventos..." />
                <button class="btn btn-secondary btn-small btn-toggle-movs">Ver Todas</button>
              </div>
            </div>
            <div class="proc-timeline"></div>
          </div>
        `;

        const timelineEl = card.querySelector('.proc-timeline');
        const filterInput = card.querySelector('.proc-movs-filter');
        const toggleBtn = card.querySelector('.btn-toggle-movs');
        let showAll = false;

        const renderTimelineItems = () => {
          timelineEl.innerHTML = '';
          const filterTerm = filterInput.value.toLowerCase().trim();

          const filtered = allMovs.filter(m => {
            if (!filterTerm) return true;
            const desc = (m.descricao || m.tipo?.nome || '').toLowerCase();
            const docs = (m.documentos || []).map(d => (d.nome + ' ' + d.tipoDocumento).toLowerCase()).join(' ');
            return desc.includes(filterTerm) || docs.includes(filterTerm);
          });

          const itemsToDisplay = showAll ? filtered : filtered.slice(0, 8);

          if (itemsToDisplay.length === 0) {
            timelineEl.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 8px;">Nenhuma movimentação corresponde ao filtro.</div>`;
            return;
          }

          itemsToDisplay.forEach(m => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'timeline-event';
            const dateStr = m.dataHora ? m.dataHora.replace('T', ' ').substring(0, 16) : '';

            let docsHtml = '';
            if (m.documentos && m.documentos.length > 0) {
              docsHtml = `
                <div class="timeline-docs">
                  ${m.documentos.map(doc => `
                    <div class="doc-item">
                      <div class="doc-info" title="${doc.nome} (${doc.tipoDocumento || ''})">
                        ${ICONS.docText}
                        <span>${doc.nome || 'Documento'}</span>
                        ${doc.quantidadePaginas ? `<span style="color: var(--text-dim); font-size: 10px;">(${doc.quantidadePaginas} pág.)</span>` : ''}
                      </div>
                      <button class="doc-btn-view" data-doc-id="${doc.id}" data-doc-name="${this.escapeHtml(doc.nome || 'Documento')}" data-proc="${num}">
                        ${ICONS.file} Ler Peça
                      </button>
                    </div>
                  `).join('')}
                </div>
              `;
            }

            eventDiv.innerHTML = `
              <div class="timeline-date">${dateStr} ${m.responsavel ? '· ' + m.responsavel : ''}</div>
              <div class="timeline-desc">${m.descricao || m.tipo?.nome || 'Movimentação'}</div>
              ${docsHtml}
            `;

            eventDiv.querySelectorAll('.doc-btn-view').forEach(btn => {
              btn.addEventListener('click', () => {
                const docId = btn.dataset.docId;
                const docName = btn.dataset.docName;
                const procNumber = btn.dataset.proc;
                this.openPieceViewer(procNumber, docId, docName);
              });
            });

            timelineEl.appendChild(eventDiv);
          });
        };

        filterInput.addEventListener('input', () => renderTimelineItems());
        toggleBtn.addEventListener('click', () => {
          showAll = !showAll;
          toggleBtn.textContent = showAll ? 'Ver Recentes (8)' : `Ver Todas (${allMovs.length})`;
          renderTimelineItems();
        });

        renderTimelineItems();
        container.appendChild(card);
      });
    }

    renderPiecesText(container, data) {
      const textContent = typeof data === 'string' ? data : (data.content || JSON.stringify(data, null, 2));
      container.innerHTML = `
        <div class="proc-card">
          <div class="proc-header">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-accent);">Texto da Peça Processual</div>
            <span class="badge-court">PEÇA</span>
          </div>
          <div style="background: var(--bg-viewer); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; font-size: 12.5px; line-height: 1.6; color: var(--text-main); max-height: 420px; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(textContent)}</div>
        </div>
      `;
    }

    renderLibraryDocument(container, data) {
      const textContent = typeof data === 'string' ? data : (data.content || JSON.stringify(data, null, 2));
      container.innerHTML = `
        <div class="proc-card">
          <div class="proc-header">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-accent);">Documento da Biblioteca Pessoal</div>
            <span class="badge-court">BIBLIOTECA</span>
          </div>
          <div style="background: var(--bg-viewer); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; font-size: 12.5px; line-height: 1.6; color: var(--text-main); max-height: 420px; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(textContent)}</div>
        </div>
      `;
    }

    // Detecta quando o Apoia repassa, como se fosse o texto da peça, um erro
    // temporário do serviço de extração de texto do PJe (Codex) — ex.: HTTP 500.
    isPieceTextUnavailable(text) {
      if (!text) return false;
      return /codex\s+indispon[ií]vel|\[50\d\s*\]\s+during\s+\[/i.test(text);
    }

    // Detecta quando o Apoia repassa, como texto da peça, um erro de peça
    // inexistente/sem metadados (permanente — não adianta retentar sozinho).
    isPieceNotFound(text) {
      if (!text) return false;
      return /n[ãa]o foi poss[ií]vel encontrar metadados para a peça|error fetching content for process/i.test(text);
    }

    appendRetryButton(body, onRetry) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-btn';
      btn.style.cssText = 'margin-top: 10px; align-self: flex-start;';
      btn.textContent = 'Tentar novamente';
      btn.addEventListener('click', onRetry);
      body.appendChild(btn);
    }

    async openPieceViewer(procNumber, docId, docName) {
      const overlay = this.shadow.getElementById('pieceViewerOverlay');
      const title = this.shadow.getElementById('pieceViewerTitle');
      const sub = this.shadow.getElementById('pieceViewerSub');
      const body = this.shadow.getElementById('pieceViewerBody');

      title.textContent = docName || 'Documento Processual';
      sub.textContent = `Processo ${procNumber} · ID: ${docId}`;
      overlay.style.display = 'flex';

      const arrayDocIds = Array.isArray(docId) ? docId : [String(docId)];
      const MAX_ATTEMPTS = 3;
      const RETRY_DELAY = 1500;
      const setLoading = (msg) => {
        body.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--text-muted);"><div class="loader"></div> ${this.escapeHtml(msg)}</div>`;
      };

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        setLoading(attempt === 1
          ? 'Carregando conteúdo da peça pelo Apoia MCP...'
          : `Serviço de texto do PJe instável. Tentando novamente (${attempt}/${MAX_ATTEMPTS})...`);

        try {
          const res = await this.client.callTool('piecesText', {
            processNumber: procNumber,
            pieceIdArray: arrayDocIds
          });

          let text = res.text || '';
          if (res.data && typeof res.data === 'object') {
            text = res.data.content || JSON.stringify(res.data, null, 2);
          }

          if (this.isPieceTextUnavailable(text)) {
            if (attempt < MAX_ATTEMPTS) {
              await new Promise(r => setTimeout(r, RETRY_DELAY));
              continue;
            }
            // Esgotou as tentativas: erro transitório persistente do Codex.
            this.currentLoadedPieceText = '';
            body.innerHTML = `
              <div class="error-card">
                <div class="error-card-title">${ICONS.alert} Serviço de texto do PJe indisponível</div>
                <div class="error-card-body">O serviço de extração de texto do PJe (Codex) retornou erro temporário para esta peça, mesmo após ${MAX_ATTEMPTS} tentativas. Costuma ser transitório — tente novamente em instantes.</div>
              </div>
            `;
            this.appendRetryButton(body, () => this.openPieceViewer(procNumber, docId, docName));
            return;
          }

          if (this.isPieceNotFound(text)) {
            this.currentLoadedPieceText = '';
            body.innerHTML = `
              <div class="error-card">
                <div class="error-card-title">${ICONS.alert} Peça não encontrada</div>
                <div class="error-card-body">O Apoia não encontrou metadados para esta peça neste processo. Ela pode ter sido removida, ainda não estar disponível, ou o identificador estar desatualizado. Se foi juntada há pouco, tente novamente em instantes.</div>
              </div>
            `;
            this.appendRetryButton(body, () => this.openPieceViewer(procNumber, docId, docName));
            return;
          }

          this.currentLoadedPieceText = text;
          body.textContent = text || 'Peça processual sem conteúdo de texto retornado.';
          return;
        } catch (err) {
          console.error('[Apoia MCP] Erro ao carregar peça:', err);
          this.currentLoadedPieceText = '';
          body.innerHTML = `
            <div class="error-card">
              <div class="error-card-title">${ICONS.alert} Falha ao obter peça processual</div>
              <div class="error-card-body">${this.escapeHtml(err.message || 'Erro desconhecido')}</div>
            </div>
          `;
          this.appendRetryButton(body, () => this.openPieceViewer(procNumber, docId, docName));
          return;
        }
      }
    }

    closePieceViewer() {
      const overlay = this.shadow.getElementById('pieceViewerOverlay');
      if (overlay) overlay.style.display = 'none';
      this.currentLoadedPieceText = '';
    }

    renderJurisprudenceCards(container, data) {
      const results = data.results || (Array.isArray(data) ? data : []);
      const total = data.total || results.length;

      const summary = document.createElement('div');
      summary.style.cssText = 'font-size: 11.5px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600;';
      summary.textContent = `Resultados encontrados: ${results.length}${data.total ? ` de ${total}` : ''}`;
      container.appendChild(summary);

      if (results.length === 0) {
        container.innerHTML += `<div style="text-align: center; color: var(--text-dim); padding: 14px;">Nenhum precedente ou tese retornada para esta busca.</div>`;
        return;
      }

      results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'juris-card';

        const orgao = item.orgao || item.data?.orgao || '';
        const especie = item.especie || item.data?.tipo || item.title || '';
        const numero = item.numero || item.data?.nr || '';
        const situacao = item.situacao || item.data?.situacao || '';
        const tese = item.tese || item.teseSnippet || item.data?.tese || item.titulo || 'Sem texto de tese.';
        const questao = item.questao || item.data?.questao || '';

        let linksHtml = '';
        if (item.paradigmas && item.paradigmas.processos) {
          linksHtml = item.paradigmas.processos.map(p => `
            <a href="${p.link}" target="_blank" rel="noopener noreferrer">
              Processo ${p.numero} ${ICONS.externalLink}
            </a>
          `).join(' ');
        }

        card.innerHTML = `
          <div class="juris-meta">
            ${orgao ? `<span class="badge-court">${orgao}</span>` : ''}
            ${especie ? `<span class="badge-type">${especie} ${numero ? '#' + numero : ''}</span>` : ''}
            ${situacao ? `<span class="badge-status">${situacao}</span>` : ''}
          </div>
          <div class="juris-tese">${tese}</div>
          ${questao ? `<div class="juris-questao"><strong>Questão:</strong> ${questao}</div>` : ''}
          ${linksHtml ? `<div class="juris-links">${linksHtml}</div>` : ''}
        `;

        container.appendChild(card);
      });
    }

    renderDateResult(container, toolName, data) {
      let mainText = '';
      let subText = '';

      if (toolName === 'currentDate') {
        mainText = typeof data === 'string' ? data : (data.date || data.data || JSON.stringify(data));
        subText = 'Data Oficial Atual (DD/MM/AAAA)';
      } else if (toolName === 'dateDiff') {
        mainText = typeof data === 'string' ? data : (data.diff || data.difference || JSON.stringify(data));
        subText = 'Tempo decorrido entre as datas informadas';
      } else if (toolName === 'addDate') {
        mainText = typeof data === 'string' ? data : (data.resultDate || data.dataFinal || JSON.stringify(data));
        subText = 'Data resultante do cálculo de prazo';
      }

      const box = document.createElement('div');
      box.className = 'prazo-display';
      box.innerHTML = `
        <div class="prazo-val">${mainText}</div>
        <div class="prazo-desc">${subText}</div>
      `;
      container.appendChild(box);
    }

    renderCalculatorResult(container, data) {
      const items = Array.isArray(data) ? data : (data.results || [data]);
      const table = document.createElement('table');
      table.className = 'data-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Expressão</th>
            <th style="text-align: right;">Resultado Calculado</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody');
      items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const expr = item.expression || `Cálculo #${idx + 1}`;
        const val = item.result !== undefined ? item.result : (item.error ? `<span style="color: var(--danger);">Erro: ${item.error}</span>` : JSON.stringify(item));
        tr.innerHTML = `
          <td><code>${this.escapeHtml(expr)}</code></td>
          <td style="text-align: right; font-weight: 700; color: var(--text-prazo-val); font-family: var(--font-mono);">${val}</td>
        `;
        tbody.appendChild(tr);
      });

      container.appendChild(table);
    }

    renderGenericData(container, data) {
      if (typeof data === 'object' && data !== null) {
        const table = document.createElement('table');
        table.className = 'data-table';
        const tbody = document.createElement('tbody');

        for (const [k, v] of Object.entries(data)) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight: 600; color: var(--text-muted); width: 35%;">${k}</td>
            <td>${typeof v === 'object' ? `<pre class="code-view">${this.escapeHtml(JSON.stringify(v, null, 2))}</pre>` : this.escapeHtml(String(v))}</td>
          `;
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        container.appendChild(table);
      } else {
        container.innerHTML = `<div style="font-size: 12.5px; color: var(--text-main);">${this.escapeHtml(String(data))}</div>`;
      }
    }

    convertToMarkdown(toolName, data) {
      if (!data) return '';
      if (toolName === 'processMetadata') {
        const list = Array.isArray(data) ? data : [data];
        return list.map(proc => {
          let out = `## Processo: ${proc.numeroProcesso || ''}\n`;
          out += `- **Tribunal:** ${proc.tribunal?.sigla || ''} (${proc.tribunal?.nome || ''})\n`;
          out += `- **Classe:** ${proc.classe?.descricao || ''}\n`;
          if (proc.assuntos?.[0]) out += `- **Assunto:** ${proc.assuntos[0].descricao}\n`;
          if (proc.informacoesGerais?.valorAcao) out += `- **Valor da Causa:** R$ ${proc.informacoesGerais.valorAcao}\n`;
          out += `\n### Partes:\n`;
          if (proc.partes?.poloAtivo) proc.partes.poloAtivo.forEach(p => out += `- **${p.tipo || 'AUTOR'}:** ${p.nome}\n`);
          if (proc.partes?.poloPassivo) proc.partes.poloPassivo.forEach(p => out += `- **${p.tipo || 'RÉU'}:** ${p.nome}\n`);
          return out;
        }).join('\n---\n\n');
      }

      if (toolName === 'piecesText' || toolName === 'libraryDocument') {
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }

      if (toolName === 'pangea' || toolName === 'semanticSearch' || toolName === 'precedent') {
        const results = data.results || (Array.isArray(data) ? data : []);
        return results.map(r => {
          const orgao = r.orgao || r.data?.orgao || 'JURIS';
          const especie = r.especie || r.data?.tipo || 'TEMA';
          const numero = r.numero || r.data?.nr ? `#${r.numero || r.data?.nr}` : '';
          const tese = r.tese || r.teseSnippet || r.data?.tese || '';
          const questao = r.questao || r.data?.questao || '';
          const situacao = r.situacao || r.data?.situacao || '';

          let out = `### [${orgao}] ${especie} ${numero}\n`;
          if (tese) out += `> **Tese:** ${tese}\n\n`;
          if (questao) out += `*Questão:* ${questao}\n\n`;
          if (situacao) out += `*Situação:* ${situacao}\n`;
          return out;
        }).join('\n---\n\n');
      }

      if (typeof data === 'object') {
        return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
      }
      return String(data);
    }

    copyCurrentResult() {
      if (!this.lastResult) return;
      let textToCopy = '';
      if (this.currentResultView === 'json') {
        textToCopy = JSON.stringify(this.lastResult.data, null, 2);
      } else if (this.currentResultView === 'markdown') {
        textToCopy = this.convertToMarkdown(this.selectedTool?.name, this.lastResult.data);
      } else {
        textToCopy = this.lastResult.text || JSON.stringify(this.lastResult.data, null, 2);
      }

      GM_setClipboard(textToCopy);
      this.showToast('Resultado copiado para a área de transferência.');
    }

    insertIntoActiveCursor() {
      if (!this.lastResult) return;
      const textToInsert = this.lastResult.text || JSON.stringify(this.lastResult.data, null, 2);

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        const start = activeEl.selectionStart || 0;
        const end = activeEl.selectionEnd || 0;
        const val = activeEl.value;
        activeEl.value = val.substring(0, start) + textToInsert + val.substring(end);
        activeEl.selectionStart = activeEl.selectionEnd = start + textToInsert.length;
        this.showToast('Texto inserido no campo ativo.');
      } else if (activeEl && activeEl.isContentEditable) {
        document.execCommand('insertText', false, textToInsert);
        this.showToast('Texto inserido no editor.');
      } else {
        GM_setClipboard(textToInsert);
        this.showToast('Nenhum campo selecionado na página. Texto copiado!');
      }
    }

    saveToHistory(toolName, args, result) {
      const entry = {
        id: Date.now(),
        date: new Date().toLocaleTimeString(),
        toolName,
        args,
        summary: result.text ? result.text.substring(0, 80) : 'Consulta realizada'
      };

      this.history.unshift(entry);
      if (this.history.length > 20) this.history.pop();
      GM_setValue(STORAGE_KEYS.HISTORY, this.history);
      this.renderHistoryList();
    }

    renderHistoryList() {
      const list = this.shadow.getElementById('historyList');
      list.innerHTML = '';

      if (this.history.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 12px;">Nenhum histórico recente.</div>`;
        return;
      }

      this.history.forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = 'background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px 10px; cursor: pointer;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
            <strong style="color: var(--primary-accent);">${item.toolName}</strong>
            <span style="color: var(--text-dim);">${item.date}</span>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.escapeHtml(JSON.stringify(item.args))}
          </div>
        `;

        card.addEventListener('click', () => {
          const tool = this.tools.find(t => t.name === item.toolName);
          if (tool) {
            this.switchViewToRunner();
            this.selectTool(tool);
            this.populateFormValues(item.args);
          }
        });

        list.appendChild(card);
      });
    }

    switchViewToRunner() {
      this.shadow.getElementById('settingsPanel').style.display = 'none';
      this.shadow.getElementById('historyPanel').style.display = 'none';
      this.shadow.getElementById('btnSettings').classList.remove('active');
      this.shadow.getElementById('btnHistory').classList.remove('active');
    }

    escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    registerEvents() {
      this.shadow.getElementById('btnClose').addEventListener('click', () => this.toggleDrawer(false));
      this.shadow.getElementById('drawerBackdrop').addEventListener('click', () => this.toggleDrawer(false));

      // Botão de alternância de tema no cabeçalho
      this.shadow.getElementById('btnThemeToggle').addEventListener('click', () => this.cycleTheme());

      // Select de tema no painel de configurações
      const themeSelect = this.shadow.getElementById('cfgThemeSelect');
      if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
          this.applyTheme(e.target.value, true);
        });
      }

      // Visualizador Modal de Peça
      this.shadow.getElementById('btnClosePieceViewer').addEventListener('click', () => this.closePieceViewer());
      this.shadow.getElementById('btnCopyPieceText').addEventListener('click', () => {
        if (this.currentLoadedPieceText) {
          GM_setClipboard(this.currentLoadedPieceText);
          this.showToast('Texto copiado!');
        }
      });
      this.shadow.getElementById('btnInsertPieceCursor').addEventListener('click', () => {
        if (this.currentLoadedPieceText) {
          const text = this.currentLoadedPieceText;
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
            const start = activeEl.selectionStart || 0;
            const end = activeEl.selectionEnd || 0;
            activeEl.value = activeEl.value.substring(0, start) + text + activeEl.value.substring(end);
            activeEl.selectionStart = activeEl.selectionEnd = start + text.length;
            this.showToast('Texto inserido no campo ativo.');
          } else if (activeEl && activeEl.isContentEditable) {
            document.execCommand('insertText', false, text);
            this.showToast('Texto inserido no editor.');
          } else {
            GM_setClipboard(text);
            this.showToast('Texto copiado para área de transferência!');
          }
        }
      });

      // Atalho Global de Teclado (Alt + M ou Escape para fechar)
      window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'm' || e.key === 'M')) {
          e.preventDefault();
          this.toggleDrawer();
        } else if (e.key === 'Escape') {
          const overlay = this.shadow.getElementById('pieceViewerOverlay');
          if (overlay && overlay.style.display === 'flex') {
            this.closePieceViewer();
          } else if (this.isOpen) {
            this.toggleDrawer(false);
          }
        }
      });

      const searchInput = this.shadow.getElementById('toolSearchInput');
      searchInput.addEventListener('input', (e) => {
        this.renderToolsGrid(e.target.value);
      });

      const navTabs = this.shadow.querySelectorAll('.nav-tab');
      navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          navTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentTab = tab.dataset.tab;
          this.switchViewToRunner();
          this.renderToolsGrid(searchInput.value);
        });
      });

      this.shadow.getElementById('btnExecute').addEventListener('click', () => this.executeCurrentTool());
      this.shadow.getElementById('btnResetForm').addEventListener('click', () => {
        if (this.selectedTool) this.renderDynamicForm(this.selectedTool);
      });

      const viewBtns = this.shadow.querySelectorAll('.tab-btn');
      viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          viewBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentResultView = btn.dataset.view;
          this.renderResultView();
        });
      });

      this.shadow.getElementById('btnCopyResult').addEventListener('click', () => this.copyCurrentResult());
      this.shadow.getElementById('btnInsertCursor').addEventListener('click', () => this.insertIntoActiveCursor());

      const btnSettings = this.shadow.getElementById('btnSettings');
      const settingsPanel = this.shadow.getElementById('settingsPanel');
      btnSettings.addEventListener('click', () => {
        const isShown = settingsPanel.style.display === 'flex';
        this.shadow.getElementById('historyPanel').style.display = 'none';
        this.shadow.getElementById('btnHistory').classList.remove('active');

        if (isShown) {
          settingsPanel.style.display = 'none';
          btnSettings.classList.remove('active');
        } else {
          settingsPanel.style.display = 'flex';
          btnSettings.classList.add('active');
          this.shadow.getElementById('cfgTokenInput').value = this.client.token;
          this.shadow.getElementById('cfgUrlInput').value = this.client.baseUrl;
          this.shadow.getElementById('cfgThemeSelect').value = this.currentTheme;
        }
      });

      this.shadow.getElementById('btnSaveConfig').addEventListener('click', () => {
        const tokenVal = this.shadow.getElementById('cfgTokenInput').value.trim();
        const urlVal = this.shadow.getElementById('cfgUrlInput').value.trim();
        const themeVal = this.shadow.getElementById('cfgThemeSelect').value;
        this.client.setCredentials(urlVal, tokenVal);
        this.applyTheme(themeVal, false);
        this.showToast('Configurações e tema salvos.');
        this.loadTools();
      });

      this.shadow.getElementById('btnTestConfig').addEventListener('click', async () => {
        this.showToast('Testando conexão com o Apoia MCP...');
        await this.loadTools();
      });

      const btnHistory = this.shadow.getElementById('btnHistory');
      const historyPanel = this.shadow.getElementById('historyPanel');
      btnHistory.addEventListener('click', () => {
        const isShown = historyPanel.style.display === 'flex';
        this.shadow.getElementById('settingsPanel').style.display = 'none';
        this.shadow.getElementById('btnSettings').classList.remove('active');

        if (isShown) {
          historyPanel.style.display = 'none';
          btnHistory.classList.remove('active');
        } else {
          historyPanel.style.display = 'flex';
          btnHistory.classList.add('active');
          this.renderHistoryList();
        }
      });

      this.shadow.getElementById('btnClearHistory').addEventListener('click', () => {
        this.history = [];
        GM_setValue(STORAGE_KEYS.HISTORY, []);
        this.renderHistoryList();
        this.showToast('Histórico limpo.');
      });
    }
  }

  const mcpClient = new McpClient();
  const mcpUI = new ApoiaMcpUI(mcpClient);

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Abrir Assistente Apoia MCP (Alt + M)', () => {
      mcpUI.toggleDrawer(true);
    });
  }
})();
