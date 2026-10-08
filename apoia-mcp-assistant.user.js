// ==UserScript==
// @name         Apoia PDPJ - Assistente MCP
// @namespace    https://apoia.pdpj.jus.br/
// @version      1.11.0
// @description  Painel lateral acionável via Alt+M para ferramentas MCP do Apoia/PDPJ (Metadados de Processos, Leitura de Peças, Decisões da Julia/TRF5, Busca Processual Unificada/TRF5, Documentos da Biblioteca, Jurisprudência Pangea, Inteiro Teor de Precedentes, Prazos e Cálculos) com temas Escuro, Claro e Sépia.
// @author       Antigravity / Apoia PDPJ
// @updateURL    https://raw.githubusercontent.com/jusgador/mcp-apoia-script/master/apoia-mcp-assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/jusgador/mcp-apoia-script/master/apoia-mcp-assistant.user.js
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @connect      apoia.pdpj.jus.br
// @connect      juliapesquisa.trf5.jus.br
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================
  // CONFIGURAÇÃO E CONSTANTES
  // ==========================================
  // Sem token embutido: cada usuário informa o seu nas Configurações (⚙),
  // obtido no portal do Apoia. Ele fica salvo localmente via GM_setValue.
  const DEFAULT_TOKEN = '';
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

  // De onde vem cada ferramenta. O painel separa visualmente as do Apoia MCP
  // (dependem do token) das consultas públicas do TRF5 (funcionam sem ele).
  const FONTES = {
    apoia: { rotulo: 'Apoia MCP', grupo: 'apoia', classe: 'src-apoia', nota: 'Requer o token do Apoia' },
    julia: { rotulo: 'Julia TRF5', grupo: 'trf5', classe: 'src-trf5', nota: 'Consulta pública da Julia — não usa o token do Apoia' },
    painel: { rotulo: 'Painel BI TRF5', grupo: 'trf5', classe: 'src-trf5', nota: 'Consulta pública ao Portal BI — não usa o token do Apoia' }
  };

  const fonteDe = (tool) => FONTES[TOOL_META[tool?.name]?.fonte] || FONTES.apoia;

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
    maximize: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    minimize: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,

    // Ícones dos Modos de Tema
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    sepia: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h6"/><path d="M9 11h6"/></svg>`
  };

  // defaultArgs traz apenas defaults neutros de parâmetros técnicos (limites,
  // modos, paginação) — os campos de conteúdo ficam vazios, guiados pelos placeholders.
  const TOOL_META = {
    processMetadata: {
      category: 'processos',
      displayName: 'Metadados Processuais',
      defaultArgs: {}
    },
    piecesText: {
      category: 'processos',
      displayName: 'Texto de Peças Processuais',
      defaultArgs: {}
    },
    juliaDecisions: {
      category: 'processos',
      displayName: 'Decisões (Julia TRF5)',
      fonte: 'julia',
      helpNotice: 'Consulta direta à Julia (TRF5), sem passar pelo Apoia — funciona mesmo com o token expirado. Cobre sentenças, acórdãos de TR/TRU e ementas do TRF5 indexados (apenas PJe). O resultado e o resumo do dispositivo são extraídos por heurística: confira na íntegra.',
      helpUrl: 'https://juliapesquisa.trf5.jus.br/julia-pesquisa/',
      helpUrlLabel: 'Abrir Julia | Pesquisa Inteligente',
      defaultArgs: {}
    },
    buscaProcessualUnificada: {
      category: 'processos',
      displayName: 'Busca Processual Unificada',
      fonte: 'painel',
      helpNotice: 'Consulta o painel "Busca Processual Unificada" do TRF5 (Portal BI, carga diária) — 1º e 2º grau da 5ª Região, por nome, CPF/CNPJ, número ou classe. É a mesma base do painel, lida direto no assistente, sem abrir aba. O documento das partes aparece mascarado, como na tela. Buscas amplas (um prenome, uma classe inteira) podem demorar.',
      helpUrl: 'https://transparencia.trf5.jus.br/single/?appid=7265b9ec-528e-4fe8-9291-42f8d1e93180',
      helpUrlLabel: 'Abrir o painel do TRF5',
      defaultArgs: { campo: 'Nome', limite: 100 }
    },
    libraryDocument: {
      category: 'processos',
      displayName: 'Documentos da Minha Biblioteca',
      helpNotice: 'Recupera o conteúdo de modelos, minutas, teses e documentos personalizados salvos na sua Biblioteca do Apoia PDPJ.',
      defaultArgs: {}
    },
    pangea: {
      category: 'jurisprudencia',
      displayName: 'Pangea (STF/STJ)',
      defaultArgs: { maxItems: 5 }
    },
    semanticSearch: {
      category: 'jurisprudencia',
      displayName: 'Busca Semântica / Híbrida',
      defaultArgs: { searchType: 'hybrid', limit: 5 }
    },
    precedent: {
      category: 'jurisprudencia',
      displayName: 'Precedentes Jurisprudenciais',
      defaultArgs: { page: 1 }
    },
    precedentFullText: {
      category: 'jurisprudencia',
      displayName: 'Inteiro Teor de Precedentes',
      helpNotice: 'Use os IDs retornados por "Precedentes Jurisprudenciais" — ou, mais simples, o botão "Inteiro teor" em cada resultado daquela ferramenta. Até 10 IDs por consulta.',
      defaultArgs: {}
    },
    leadingCaseSearch: {
      category: 'jurisprudencia',
      displayName: 'Leading Case (Paradigma)',
      defaultArgs: {}
    },
    currentDate: {
      category: 'prazos',
      displayName: 'Data Atual Oficial',
      defaultArgs: {}
    },
    dateDiff: {
      category: 'prazos',
      displayName: 'Diferença de Prazos (Datas)',
      defaultArgs: {}
    },
    addDate: {
      category: 'prazos',
      displayName: 'Somar/Subtrair Prazos',
      defaultArgs: {}
    },
    calculator: {
      category: 'calculo',
      displayName: 'Calculadora de Expressões',
      defaultArgs: {}
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
    defaultVariables: 'Variáveis aplicadas a todos os cálculos do lote.',
    processNumbers: 'Um ou mais números CNJ, com ou sem máscara. Pode colar um texto: os números são extraídos dele.',
    campo: 'Onde procurar: Nome (parte ou advogado), CPF/CNPJ, Número do Processo ou Classe Judicial.',
    termo: 'Nome, CPF/CNPJ, número CNJ ou classe. No nome valem aspas para expressão exata (ex.: "MARIA SILVA") e * como curinga.',
    limite: 'Máximo de linhas na tabela (1 a 500).',
    idArray: 'IDs (campo "id") dos resultados de Precedentes Jurisprudenciais, separados por vírgula. Até 10.',
    limiteCaracteres: 'Corta o texto de cada documento neste tamanho (padrão 50000).'
  };

  // ==========================================
  // JULIA (TRF5) — FERRAMENTA LOCAL, SEM MCP
  // ==========================================
  // API pública usada pela própria página da Julia (juliapesquisa.trf5.jus.br),
  // sem autenticação. GET /processo/{numero} devolve {status, mensagem, resultado[]}
  // com as decisões indexadas daquele número em todas as instâncias (JEF, TR,
  // TRU, varas, TRF5). Observado em out/2026: cada documento vem duplicado
  // (mesmo codigoDocumento) e só texto/metadados básicos vêm preenchidos.
  const JULIA_API_BASE = 'https://juliapesquisa.trf5.jus.br/julia-pesquisa/api/v1/processo/';
  const JULIA_MAX_PROCESSOS = 20;

  const LOCAL_TOOLS = [{
    name: 'juliaDecisions',
    local: true,
    description: 'Sentenças, acórdãos e ementas indexados na Julia (TRF5) para um ou mais processos, em ordem cronológica, com resultado e dispositivo destacados. Útil para comparar processos conexos.',
    inputSchema: {
      type: 'object',
      properties: {
        processNumbers: {
          type: 'string',
          maxLength: 5000,
          description: 'Ex.: 0003014-69.2019.4.05.8109, 0800006-17.2011.4.05.8308'
        }
      },
      required: ['processNumbers']
    }
  }, {
    name: 'buscaProcessualUnificada',
    local: true,
    description: 'Localiza processos de 1º e 2º grau da 5ª Região por nome, CPF/CNPJ, número ou classe, no painel "Busca Processual Unificada" do TRF5 (Portal BI, carga diária).',
    inputSchema: {
      type: 'object',
      properties: {
        campo: {
          type: 'string',
          enum: ['Nome', 'CPF/CNPJ', 'Número do Processo', 'Classe Judicial'],
          default: 'Nome'
        },
        termo: {
          type: 'string',
          maxLength: 200,
          description: 'Nome completo, CPF/CNPJ, número CNJ (com ou sem máscara) ou classe. No nome, aspas fecham expressão exata.'
        },
        limite: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          default: 100
        }
      },
      required: ['campo', 'termo']
    }
  }];

  const TIPO_DOC_JULIA = { SENTENCA: 'Sentença', ACORDAO: 'Acórdão', EMENTA: 'Ementa' };

  // Extrai números CNJ (com ou sem máscara) de um texto livre, sem repetições.
  function extrairNumerosCnj(texto) {
    const re = /\b\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}\b/g;
    const vistos = new Set();
    for (const m of String(texto || '').match(re) || []) vistos.add(m.replace(/\D/g, ''));
    return [...vistos];
  }

  function formatarCnj(digitos) {
    const d = String(digitos || '').replace(/\D/g, '');
    if (d.length !== 20) return digitos;
    return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`;
  }

  function formatarDataIso(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }

  // Meses abreviados para os períodos das abas de instância (ex.: mar/2020).
  function mesAno(iso) {
    const m = /^(\d{4})-(\d{2})/.exec(iso || '');
    if (!m) return '?';
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${meses[Number(m[2]) - 1]}/${m[1]}`;
  }

  // Alguns registros migrados chegam com UTF-8 lido como Latin-1
  // («tramitaÃ§Ã£o»). Só reinterpreta quando o padrão aparece e a releitura
  // é UTF-8 válido; caso contrário, devolve o texto como veio.
  function corrigirMojibake(texto) {
    if (typeof texto !== 'string' || !/\u00C3[\u0080-\u00BF]/.test(texto) || !/^[\u0000-\u00FF]*$/.test(texto)) return texto;
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(texto, c => c.charCodeAt(0)));
    } catch (e) {
      return texto;
    }
  }

  // O texto chega com quebras e espaços soltos e, às vezes, restos de HTML do
  // Word (<!--[endif]-->). Mesmo critério de parágrafo da página da Julia.
  function normalizarTextoJulia(texto) {
    return String(texto || '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!\[[\s\S]*?\]>/g, '')
      .replace(/<\/?[a-z][^>]*>/gi, '')
      .replace(/\s*[\r\n]+\s*/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  // Trecho do dispositivo por heurística, conforme o tipo de documento.
  function extrairDispositivo(tipo, texto) {
    if (!texto) return '';
    const corta = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + ' […]' : s);

    if (tipo === 'ACORDAO') {
      const ocorrencias = [...texto.matchAll(/(?:^|\n)[^\n]*\bacorda[m]?\b[^\n]*/gi)];
      if (ocorrencias.length) return corta(ocorrencias[ocorrencias.length - 1][0].trim(), 700);
    }

    if (tipo === 'EMENTA') {
      // Formato CNJ novo: linha só com "IV. Dispositivo (e tese)" — não casa com
      // "Dispositivos relevantes citados" —, sem as listas de citações.
      const secao = /(?:^|\n)\s*(?:[IVX]+\s*[.\-–]\s*)?DISPOSITIVO(?: E TESE)?\s*:?\s*\n([\s\S]*)/i.exec(texto);
      if (secao) {
        const corpo = secao[1].split(/\n\s*(?:Dispositivos? relevantes? citados?|Jurisprud[êe]ncia relevante citada)/i)[0];
        return corta(corpo.trim(), 700);
      }
      // Cabeçalho da ementa em caixa alta: "... APELAÇÃO PROVIDA."
      const cab = /[^.\n]*\b(?:PROVID[OA]S?|IMPROVID[OA]S?|DESPROVID[OA]S?|N[ÃA]O\s+CONHECID[OA]S?|PREJUDICAD[OA]S?)\b[^.\n]*\.?/.exec(texto);
      if (cab) return corta(cab[0].trim(), 500);
    }

    // Sentença (e fallback): último marcador clássico de dispositivo. A palavra
    // "dispositivo" só vale como título de seção ("III – Dispositivo."), não no
    // meio da fundamentação ("O dispositivo estabelece...").
    const marcadores = /(?:^|\n)[^\n]*?\b(?:ante o exposto|diante do exposto|pelo exposto|isto posto|isso posto|posto isso|em face do exposto|em face do quanto exposto|por todo o exposto|por tais raz[õo]es|ante o expendido)\b|(?:^|\n)\s*(?:[IVX]+\s*[.\-–]\s*)?dispositivo\s*[.:]?\s*(?=\n)/gi;
    const achados = [...texto.matchAll(marcadores)];
    if (achados.length) {
      const ini = achados[achados.length - 1].index;
      return corta(texto.slice(ini).trim(), 1200);
    }
    return '';
  }

  // Classifica o resultado a partir do dispositivo (ou do texto). A ordem
  // importa: "improcedente" antes de "procedente", "improvido" antes de "provido".
  // Em acórdão/ementa vale o resultado do recurso ("apelação provida para
  // extinguir o processo" é PROVIDO); em sentença, o do pedido.
  const REGRAS_PEDIDO = [
    [/parcialmente procedente|procedente em parte|parcial proced[êe]ncia/, 'PARCIALMENTE PROCEDENTE'],
    [/improcedente|improced[êe]ncia/, 'IMPROCEDENTE'],
    [/\bprocedente|\bproced[êe]ncia/, 'PROCEDENTE'],
    [/sem (?:resolu[çc][ãa]o|julgamento) (?:do|de) m[ée]rito|extin[çc][ãa]o do processo|extingo o processo/, 'EXTINTO SEM MÉRITO'],
    [/homolog/, 'HOMOLOGAÇÃO']
  ];
  const REGRAS_RECURSO = [
    [/parcial provimento|parcialmente provid|provid[oa]s? em parte/, 'PARCIALMENTE PROVIDO'],
    [/\bneg(?:ar|o|ou|aram|a)(?:-se|-lhes?)? provimento|improvid|desprovid|n[ãa]o provid/, 'NÃO PROVIDO'],
    [/\bd(?:ar|ou|eu|eram|á)(?:-se|-lhes?)? provimento|\bprovid[oa]s?\b/, 'PROVIDO'],
    [/n[ãa]o conhe[çc]/, 'NÃO CONHECIDO'],
    [/prejudicad/, 'PREJUDICADO'],
    [/\brejeit(?:o|ar|ados?|adas?)\b/, 'REJEITADO'],
    [/\bacolh(?:o|er|idos?|idas?)\b/, 'ACOLHIDO']
  ];

  function classificarResultado(trecho, tipo) {
    const t = String(trecho || '').toLowerCase();
    if (!t) return '';
    const regras = tipo === 'SENTENCA' ? [...REGRAS_PEDIDO, ...REGRAS_RECURSO] : [...REGRAS_RECURSO, ...REGRAS_PEDIDO];
    for (const [re, rotulo] of regras) if (re.test(t)) return rotulo;
    return '';
  }

  function classificarVotacao(trecho) {
    const t = String(trecho || '').toLowerCase();
    if (/por unanimidade|un[âa]nime/.test(t)) return 'unanimidade';
    if (/por maioria/.test(t)) return 'maioria';
    return '';
  }

  function juliaGetJson(url) {
    return new Promise((resolve, reject) => {
      const tratar = (status, texto) => {
        if (status < 200 || status >= 300) return reject({ status, message: `Julia respondeu HTTP ${status}` });
        try { resolve(JSON.parse(texto)); } catch (e) { reject({ message: 'Resposta inválida da Julia' }); }
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: { 'Accept': 'application/json' },
          timeout: 30000,
          onload: (res) => tratar(res.status, res.responseText),
          onerror: () => reject({ message: 'fetch failed: não foi possível conectar à Julia (TRF5)' }),
          ontimeout: () => reject({ message: 'Tempo limite excedido ao consultar a Julia (TRF5).' })
        });
        return;
      }
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(async (r) => tratar(r.status, await r.text()))
        .catch(() => reject({ message: 'fetch failed: não foi possível conectar à Julia (TRF5)' }));
    });
  }

  async function consultarJulia(numero) {
    const json = await juliaGetJson(JULIA_API_BASE + numero);
    // Além da duplicata exata (mesmo codigoDocumento), a Julia indexa a mesma
    // decisão uma vez por registro do PJe quando o processo foi migrado de
    // sistema: códigos diferentes, mesmo tipo, data e texto. Uma só basta.
    const unicos = new Map();
    for (const d of json.resultado || []) {
      const texto = normalizarTextoJulia(d.texto || d.ementa);
      const chave = texto ? `${d.tipoDocumento}|${d.dataJulgamento}|${texto}` : d.codigoDocumento;
      if (!unicos.has(chave)) unicos.set(chave, { ...d, textoNormalizado: texto });
    }
    return [...unicos.values()]
      .map(d => {
        const texto = d.textoNormalizado;
        const dispositivo = extrairDispositivo(d.tipoDocumento, texto);
        return {
          codigoDocumento: d.codigoDocumento,
          tipoDocumento: d.tipoDocumento,
          tipoLabel: TIPO_DOC_JULIA[d.tipoDocumento] || d.tipoDocumento || 'Documento',
          instancia: d.instancia,
          orgao: d.orgao,
          sistema: d.sistema,
          orgaoJulgador: d.orgaoJulgador,
          classeJudicial: d.classeJudicial,
          relator: d.relator,
          relatorAcordao: d.relatorAcordao,
          dataJulgamento: d.dataJulgamento,
          dataAssinatura: d.dataAssinatura,
          resultado: classificarResultado(dispositivo || texto.slice(0, 600), d.tipoDocumento),
          votacao: d.tipoDocumento === 'SENTENCA' ? '' : classificarVotacao(dispositivo || texto),
          dispositivo,
          texto,
          citacao: d.resumo || ''
        };
      })
      .sort((a, b) => String(a.dataJulgamento || '').localeCompare(String(b.dataJulgamento || '')));
  }

  async function executarJuliaDecisions(args) {
    const numeros = extrairNumerosCnj(args.processNumbers);
    if (numeros.length === 0) {
      throw { message: 'Nenhum número de processo CNJ válido encontrado no texto informado.' };
    }
    const alvo = numeros.slice(0, JULIA_MAX_PROCESSOS);
    const processos = await Promise.all(alvo.map(async (n) => {
      try {
        return { numeroProcesso: formatarCnj(n), documentos: await consultarJulia(n) };
      } catch (err) {
        return { numeroProcesso: formatarCnj(n), documentos: [], erro: err.message || 'Falha na consulta' };
      }
    }));
    if (processos.every(p => p.erro)) throw { message: processos[0].erro };
    return {
      processos,
      ignorados: numeros.length - alvo.length
    };
  }

  // ==========================================
  // BUSCA PROCESSUAL UNIFICADA (painel Qlik do TRF5)
  // ==========================================
  // O painel "Busca Processual Unificada" (transparencia.trf5.jus.br) é um app
  // Qlik Sense alimentado pela carga diária do Portal BI; a tela procura por
  // nome, CPF/CNPJ, número ou classe em 1º e 2º grau da 5ª Região. Não há API
  // HTTP: a consulta é feita ao motor Qlik por WebSocket (protocolo JSON-RPC).
  // O proxy do Qlik só aceita WebSocket de origens da própria instalação ou de
  // origem opaca, então a consulta sai de um iframe `sandbox` (Origin: null)
  // criado durante a execução e descartado em seguida — nada é conectado no
  // carregamento da página.
  const PAINEL_QLIK = {
    host: 'transparencia.trf5.jus.br',
    appId: '7265b9ec-528e-4fe8-9291-42f8d1e93180'
  };

  // Rótulo exibido no formulário -> campo real do modelo (conferido no app).
  const BUSCA_CAMPOS_QLIK = {
    'Nome': 'Parte Descrição',
    'CPF/CNPJ': 'CPF/CNPJ',
    'Número do Processo': 'Número Processo',
    'Classe Judicial': 'Classe Judicial'
  };

  // Colunas da tabela, na mesma ordem do painel, acrescidas do tipo de pessoa e
  // da data da 1ª distribuição (que o modelo tem, mas a tela não mostra). "Parte
  // Documento" é a versão mascarada do documento (o campo com o CPF/CNPJ completo
  // é o "CPF/CNPJ", usado apenas para pesquisar, nunca para exibir).
  const BUSCA_COLUNAS_QLIK = [
    { campo: 'Parte Descrição', titulo: 'Nome' },
    { campo: 'Parte Descrição Tipo', titulo: 'Sujeito Processual' },
    { campo: 'Parte Tipo Pessoa', titulo: 'Pessoa' },
    { campo: 'Parte Documento', titulo: 'CPF/CNPJ' },
    { campo: 'Número Processo', titulo: 'Número do Processo' },
    // A data vem como serial do Qlik (ex.: 43716) e é formatada em JS: usar
    // =Date(...) como dimensão calculada faz o motor montar a tabela em ~26s em
    // vez de ~2s, por isso o campo entra cru e a conversão é feita aqui.
    { campo: 'Data Primeira Distribuição', titulo: '1ª Distribuição', tipo: 'data' },
    { campo: 'Classe Judicial', titulo: 'Classe Judicial' },
    { campo: 'Sistema', titulo: 'Sistema' },
    { campo: '%SJ_PROCESSO_TRF', titulo: 'Seção' },
    { campo: 'Grau', titulo: 'Grau' },
    { campo: 'Instância', titulo: 'Instância' },
    { campo: 'Link', titulo: 'Consulta' }
  ];

  const BUSCA_LIMITE_MAX = 500;
  const BUSCA_TIMEOUT_MS = 90000;

  // O motor faz busca textual (com curingas); CPF/CNPJ e número chegam em
  // formatos diferentes dos digitados, então são normalizados antes.
  function normalizarTermoQlik(campo, termo) {
    const t = String(termo || '').trim();
    if (campo === 'CPF/CNPJ') {
      const digitos = t.replace(/\D/g, '');
      if (!digitos) return t;
      // O campo guarda o documento COM a máscara (ex.: "170.340.003-87"), então
      // procurar os dígitos corridos ("*17034000387*") não casa nada. Intercalar
      // "*" entre os dígitos faz o motor ignorar a pontuação — e assim serve
      // tanto para CPF/CNPJ digitado com máscara quanto só com números.
      return `*${digitos.split('').join('*')}*`;
    }
    if (campo === 'Número do Processo') {
      const digitos = t.replace(/\D/g, '');
      return digitos.length === 20 ? formatarCnj(digitos) : t;
    }
    return t;
  }

  // Script executado dentro do iframe de origem opaca. Fala o JSON-RPC do motor
  // Qlik e devolve o resultado ao painel por postMessage. Sem GM_* aqui.
  function htmlSandboxQlik(spec) {
    const dados = JSON.stringify(spec).replace(/</g, '\\u003c');
    const logica = `
var SPEC = ${dados};
post({ tipo: 'iniciando' });
var ws = null, seq = 0, pend = {}, fim = false, relogio = null;
function post(o) { o.__apoiaBusca = SPEC.token; parent.postMessage(o, '*'); }
function encerrar(ok, dados) {
  if (fim) { return; }
  fim = true;
  if (relogio) { clearTimeout(relogio); }
  try { if (ws && ws.readyState === 1) { ws.close(); } } catch (e) {}
  post({ tipo: ok ? 'resultado' : 'erro', dados: dados });
}
function falha(msg) { encerrar(false, msg); }
function send(method, handle, params) {
  var id = ++seq;
  ws.send(JSON.stringify({ jsonrpc: '2.0', id: id, method: method, handle: handle, params: params }));
  return new Promise(function (res) { pend[id] = res; });
}
// Datas do Qlik chegam como serial (dias desde 1899-12-30); o tipo da coluna diz
// quais precisam ser convertidas. Math.floor descarta a hora (08/09 21h = 08/09).
function celula(c, tipo) {
  if (!c) { return ''; }
  if (tipo === 'data' && typeof c.qNum === 'number' && isFinite(c.qNum) && c.qNum > 0) {
    var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(c.qNum) * 86400000);
    var p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }
  return c.qText;
}
async function consultar() {
  var od = await send('OpenDoc', -1, { qDocName: SPEC.appId, qUserName: null, qPassword: null, qSerial: null, qNoData: false });
  if (od.error) { throw new Error(od.error.message || 'OpenDoc falhou'); }
  var h = od.result.qReturn.qHandle;

  var lb = await send('CreateSessionObject', h, { qProp: { qInfo: { qType: 'apoiaBuscaLb' }, qListObjectDef: { qDef: { qFieldDefs: [SPEC.campo] }, qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 1, qHeight: 1 }] } } });
  if (lb.error) { throw new Error(lb.error.message || 'Criação da busca falhou'); }
  var lbH = lb.result.qReturn.qHandle;

  var sr = await send('SearchListObjectFor', lbH, { qPath: '/qListObjectDef', qMatch: SPEC.termo });
  if (sr.error) { throw new Error(sr.error.message || 'Busca falhou'); }

  // O motor pode responder à leitura antes de a busca estar aplicada — a lista
  // aparece momentaneamente vazia. Sem confirmar, uma busca com resultados era
  // anunciada como "nenhum registro". Só depois de 3 leituras vazias seguidas é
  // que se conclui que não há correspondência.
  var casados = 0;
  for (var tentativa = 0; tentativa < 3 && !casados; tentativa++) {
    if (tentativa) { await esperar(350); }
    var dados = await send('GetListObjectData', lbH, { qPath: '/qListObjectDef', qPages: [{ qTop: 0, qLeft: 0, qWidth: 1, qHeight: 1 }] });
    var pagBusca = dados && dados.result ? dados.result.qDataPages : null;
    var naPagina = pagBusca && pagBusca[0] && pagBusca[0].qMatrix ? pagBusca[0].qMatrix.length : 0;
    var lay = await send('GetLayout', lbH, {});
    var lo = lay && lay.result && lay.result.qLayout ? lay.result.qLayout.qListObject : null;
    casados = Math.max(naPagina, lo && lo.qSize ? lo.qSize.qcy : 0);
  }
  if (!casados) { return encerrar(true, { total: 0, casados: 0, linhas: [] }); }

  var ac = await send('AcceptListObjectSearch', lbH, { qPath: '/qListObjectDef', qToggleMode: false, qSoftLock: false });
  if (ac.error) { throw new Error(ac.error.message || 'Seleção falhou'); }

  var dims = SPEC.colunas.map(function (f) { return { qDef: { qFieldDefs: [f] } }; });
  var cb = await send('CreateSessionObject', h, { qProp: { qInfo: { qType: 'apoiaBuscaTab' }, qHyperCubeDef: { qDimensions: dims, qMeasures: [], qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: SPEC.colunas.length, qHeight: SPEC.limite }] } } });
  if (cb.error) { throw new Error(cb.error.message || 'Montagem da tabela falhou'); }

  var gl = await send('GetLayout', cb.result.qReturn.qHandle, {});
  if (gl.error) { throw new Error(gl.error.message || 'Leitura da tabela falhou'); }
  var hc = gl.result.qLayout.qHyperCube;
  var pag = (hc.qDataPages && hc.qDataPages[0]) || null;
  var linhas = ((pag && pag.qMatrix) || []).map(function (r) {
    return r.map(function (c, i) { return celula(c, SPEC.tipos && SPEC.tipos[i]); });
  });
  encerrar(true, { total: hc.qSize.qcy, casados: casados, linhas: linhas });
}
function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function iniciar() {
  try { ws = new WebSocket('wss://' + SPEC.host + '/app/' + SPEC.appId); }
  catch (e) { return falha('Não foi possível abrir a conexão com o painel do TRF5.'); }
  relogio = setTimeout(function () { falha('Tempo limite excedido na consulta ao painel do TRF5.'); }, SPEC.tempoLimite);
  ws.onerror = function () { falha('O painel do TRF5 recusou a conexão a partir desta página.'); };
  ws.onmessage = function (ev) {
    var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (m && m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
  };
  ws.onopen = function () { consultar().catch(function (e) { falha((e && e.message) || 'Falha na consulta ao painel do TRF5.'); }); };
}
iniciar();
`;
    return '<!doctype html><meta charset="utf-8"><body><scr' + 'ipt>' + logica
      + '<' + '/scr' + 'ipt></body>';
  }

  // Cria o iframe sob demanda, espera a resposta e o remove.
  function consultarPainelQlik({ campo, termo, limite }) {
    return new Promise((resolve, reject) => {
      const spec = {
        token: 'apoia-qlik-' + Date.now().toString(36) + Math.random().toString(36).slice(2),
        host: PAINEL_QLIK.host,
        appId: PAINEL_QLIK.appId,
        campo,
        termo,
        colunas: BUSCA_COLUNAS_QLIK.map(c => c.campo),
        tipos: BUSCA_COLUNAS_QLIK.map(c => c.tipo || 'texto'),
        limite,
        tempoLimite: BUSCA_TIMEOUT_MS - 5000
      };

      const iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.tabIndex = -1;
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;visibility:hidden;';

      let encerrado = false;
      let iniciou = false;
      let relogio;
      let relogioInicio;

      const limpar = () => {
        clearTimeout(relogio);
        clearTimeout(relogioInicio);
        window.removeEventListener('message', aoReceber);
        try { iframe.remove(); } catch (e) { /* ignore */ }
      };
      const abortar = (msg) => {
        if (encerrado) return;
        encerrado = true;
        limpar();
        reject({ message: msg });
      };

      const aoReceber = (ev) => {
        if (ev.source !== iframe.contentWindow) return;
        const d = ev.data;
        if (!d || d.__apoiaBusca !== spec.token) return;
        if (d.tipo === 'iniciando') { iniciou = true; clearTimeout(relogioInicio); return; }
        if (encerrado) return;
        encerrado = true;
        limpar();
        if (d.tipo === 'resultado') resolve(d.dados || { total: 0, casados: 0, linhas: [] });
        else reject({ message: d.dados || 'Falha ao consultar o painel do TRF5.' });
      };

      relogio = setTimeout(() => abortar('Tempo limite excedido ao consultar o painel do TRF5. Buscas muito amplas (só o prenome, ou por classe inteira) demoram — refine o termo e tente de novo.'), BUSCA_TIMEOUT_MS);
      // Se o iframe nem carregar (CSP da página bloqueando srcdoc), não faz
      // sentido esperar o timeout cheio.
      relogioInicio = setTimeout(() => { if (!iniciou) abortar('O painel do TRF5 não pôde ser iniciado nesta página (a política de segurança do site bloqueou o canal de consulta).'); }, 8000);

      window.addEventListener('message', aoReceber);
      iframe.srcdoc = htmlSandboxQlik(spec);
      (document.body || document.documentElement).appendChild(iframe);
    });
  }

  async function executarBuscaProcessualUnificada(args) {
    const campo = BUSCA_CAMPOS_QLIK[args.campo] ? args.campo : 'Nome';
    const digitado = String(args.termo || '').trim();
    if (!digitado) throw { message: 'Informe o nome, CPF/CNPJ, número do processo ou classe a pesquisar.' };

    const termo = normalizarTermoQlik(campo, digitado);
    const limite = Math.min(Math.max(parseInt(args.limite, 10) || 100, 1), BUSCA_LIMITE_MAX);
    const r = await consultarPainelQlik({ campo: BUSCA_CAMPOS_QLIK[campo], termo, limite });

    return {
      campo,
      termo,
      limite,
      total: r.total,
      casados: r.casados,
      truncado: r.linhas.length < r.total,
      colunas: BUSCA_COLUNAS_QLIK.map(c => c.titulo),
      linhas: r.linhas
    };
  }

  // ==========================================
  // CONSULTA PÚBLICA DO PJe — PREENCHIMENTO AUTOMÁTICO
  // ==========================================
  // O item "Acompanhar" da busca unificada abre a consulta pública do sistema
  // numa aba nova, com o número marcado no endereço (#apoia-consulta=...). Como
  // o userscript também roda nas páginas do PJe, a instância que abre lá
  // preenche o campo "Processo", dispara a pesquisa e abre o detalhe — o mesmo
  // que se faria à mão. No TRF5 o reCAPTCHA está desativado no próprio site
  // (a função executarReCaptcha tem "if (false)"), então o clique funciona
  // por script. Só os sistemas PJe (pje1g, pje2g, pjett) têm esse formulário —
  // Creta, Tebas e SEEU são outros sistemas e abrem pelo link comum.
  const CONSULTA_MARCA_HASH = 'apoia-consulta=';
  const CONSULTA_PJE_LISTA = /\/pjeconsulta\/ConsultaPublica\/listView\.seam/i;
  const CONSULTA_PJE_DETALHE = '/pjeconsulta/ConsultaPublica/DetalheProcessoConsultaPublica/listView.seam?ca=';

  function consultaPjeAutomatizavel(url) {
    return CONSULTA_PJE_LISTA.test(String(url || ''));
  }

  function abrirAcompanhamentoPje(url, numero) {
    const destino = String(url || '').split('#')[0] + '#' + CONSULTA_MARCA_HASH + encodeURIComponent(numero);
    window.open(destino, '_blank', 'noopener');
  }

  // A página do PJe monta o formulário por JS: espera o elemento aparecer.
  function esperarPor(obter, tempoMs) {
    const inicio = Date.now();
    return new Promise((resolve) => {
      const passo = () => {
        let valor = null;
        try { valor = obter(); } catch (e) { valor = null; }
        if (valor) return resolve(valor);
        if (Date.now() - inicio > tempoMs) return resolve(null);
        setTimeout(passo, 300);
      };
      passo();
    });
  }

  // Aviso discreto no alto da página, para a automação não parecer travamento.
  function avisoConsulta(texto) {
    const el = document.createElement('div');
    el.textContent = texto;
    el.style.cssText = 'position:fixed;z-index:2147483647;left:50%;top:12px;transform:translateX(-50%);'
      + 'background:#1e3a5f;color:#e2e8f0;padding:8px 14px;border-radius:6px;font:13px/1.4 sans-serif;'
      + 'box-shadow:0 2px 10px rgba(0,0,0,.35);max-width:90vw;text-align:center;';
    (document.body || document.documentElement).appendChild(el);
    return {
      atualizar: (t) => { el.textContent = t; },
      remover: (t) => { if (t) { el.textContent = t; setTimeout(() => el.remove(), 5000); } else { el.remove(); } }
    };
  }

  // Códigos "ca" dos resultados já renderizados (o detalhe só existe depois da pesquisa).
  function codigosDetalhe() {
    const vistos = new Set();
    document.querySelectorAll('[onclick*="DetalheProcessoConsultaPublica"]').forEach((a) => {
      const m = /ca=([0-9a-f]{16,})/i.exec(a.getAttribute('onclick') || '');
      if (m) vistos.add(m[1]);
    });
    return [...vistos];
  }

  async function automatizarConsultaPje(numero) {
    if (!CONSULTA_PJE_LISTA.test(location.pathname)) return;
    const aviso = avisoConsulta(`Apoia MCP: preenchendo a busca do processo ${numero}…`);
    try {
      const campo = await esperarPor(
        () => document.querySelector('input[id$="numProcesso-inputNumeroProcesso"]') || document.querySelector('input[name*="numProcesso"]'),
        30000
      );
      const botao = await esperarPor(
        () => document.getElementById('fPP:searchProcessos')
          || [...document.querySelectorAll('input[type="button"], input[type="submit"], button')]
            .find((e) => /pesquisar/i.test(e.value || e.textContent || '')),
        30000
      );
      if (!campo || !botao) {
        aviso.remover('Apoia MCP: não localizei o campo ou o botão de pesquisa nesta página.');
        return;
      }

      campo.focus();
      campo.value = numero;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      campo.dispatchEvent(new Event('change', { bubbles: true }));
      aviso.atualizar('Apoia MCP: pesquisando o processo…');
      botao.click();

      const codigos = await esperarPor(() => { const l = codigosDetalhe(); return l.length ? l : null; }, 40000);
      if (!codigos) {
        aviso.remover('Apoia MCP: a pesquisa foi enviada, mas não voltou resultado. Confira o número.');
        return;
      }
      if (codigos.length > 1) {
        aviso.remover(`Apoia MCP: ${codigos.length} resultados nesta base — escolha um na lista.`);
        return;
      }
      aviso.atualizar('Apoia MCP: abrindo o detalhe do processo…');
      location.href = CONSULTA_PJE_DETALHE + codigos[0];
    } catch (e) {
      aviso.remover('Apoia MCP: não consegui automatizar a consulta nesta página.');
    }
  }

  function iniciarAtalhoConsulta() {
    if (window.top !== window) return;
    if (!location.hash.includes(CONSULTA_MARCA_HASH)) return;
    const numero = decodeURIComponent(location.hash.slice(location.hash.indexOf(CONSULTA_MARCA_HASH) + CONSULTA_MARCA_HASH.length)).trim();
    if (!numero) return;
    // Limpa a marca: um recarregamento manual volta à página normal.
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    automatizarConsultaPje(numero);
  }

  // ==========================================
  // CLIENTE DE REDE MCP
  // ==========================================
  // Serialização JSON imune ao Array.prototype.toJSON injetado por frameworks
  // antigos da página hospedeira (Prototype.js 1.6 do PJe): com ele presente,
  // JSON.stringify transforma qualquer array numa STRING com o JSON dentro
  // ("pieceIdArray":"[\"x\"]") e o servidor MCP rejeita com -32602 «expected
  // array, received string». Arrays e objetos são montados à mão; só primitivos
  // passam pelo JSON.stringify nativo (toJSON não se aplica a primitivos).
  function safeJsonStringify(v) {
    if (v === undefined || typeof v === 'function') return undefined;
    if (Array.isArray(v)) {
      return '[' + Array.prototype.map.call(v, (x) => {
        const s = safeJsonStringify(x);
        return s === undefined ? 'null' : s;
      }).join(',') + ']';
    }
    if (v !== null && typeof v === 'object') {
      const partes = [];
      for (const k of Object.keys(v)) {
        const s = safeJsonStringify(v[k]);
        if (s !== undefined) partes.push(JSON.stringify(k) + ':' + s);
      }
      return '{' + partes.join(',') + '}';
    }
    return JSON.stringify(v);
  }

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

      if (name === 'precedentFullText') {
        const ids = Array.isArray(args.idArray) ? args.idArray : [args.idArray];
        args.idArray = ids.flatMap(v => String(v ?? '').split(/[\s,;]+/)).filter(Boolean);
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

        // JSON.stringify é inseguro para arrays em páginas com Prototype.js
        // (ex.: PJe, que define Array.prototype.toJSON — pieceIdArray virava
        // STRING e o servidor rejeitava com -32602 "expected array, received
        // string", mesmo depois da correção 1.4.1). Serialização à mão.
        const postBody = safeJsonStringify(payload);

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
      --src-apoia: #60a5fa;
      --src-apoia-bg: rgba(96, 165, 250, 0.12);
      --src-trf5: #2dd4bf;
      --src-trf5-bg: rgba(45, 212, 191, 0.12);
      --ok: #34d399;
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
      --src-apoia: #1d4ed8;
      --src-apoia-bg: #eff6ff;
      --src-trf5: #0f766e;
      --src-trf5-bg: #ecfdf5;
      --ok: #059669;
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
      --src-apoia: #7a4a1e;
      --src-apoia-bg: #ead9bd;
      --src-trf5: #2f6b4f;
      --src-trf5-bg: #dbe8d2;
      --ok: #2b6e22;
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

    /* Indicador de token expirado sobre o ícone de Configurações. */
    .btn-icon.has-alert {
      position: relative;
      color: var(--danger-text);
    }

    .btn-icon.has-alert::after {
      content: '';
      position: absolute;
      top: 3px;
      right: 3px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--danger);
    }

    /* ---------- Fontes de dados: Apoia MCP (com token) x TRF5 (públicas) ---------- */
    .src-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      padding: 1px 7px;
      border-radius: 999px;
      border: 1px solid currentColor;
      white-space: nowrap;
    }

    .src-chip.src-apoia { color: var(--src-apoia); background: var(--src-apoia-bg); }
    .src-chip.src-trf5 { color: var(--src-trf5); background: var(--src-trf5-bg); }

    .tools-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tool-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tool-group-head {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--group-color);
    }

    .tool-group.src-apoia { --group-color: var(--src-apoia); --group-bg: var(--src-apoia-bg); }
    .tool-group.src-trf5 { --group-color: var(--src-trf5); --group-bg: var(--src-trf5-bg); }

    .tool-group-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--group-color);
    }

    .tool-group-sub {
      font-size: 11px;
      color: var(--text-muted);
      flex: 1;
      min-width: 140px;
    }

    .group-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .group-status::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-dim);
    }

    .group-status.ok { color: var(--ok); }
    .group-status.ok::before { background: var(--ok); }
    .group-status.expired, .group-status.error { color: var(--danger-text); }
    .group-status.expired::before, .group-status.error::before { background: var(--danger); }

    .group-link {
      background: transparent;
      border: none;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-accent);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 0;
    }

    .group-link:hover { text-decoration: underline; }

    .group-empty {
      font-size: 11.5px;
      color: var(--text-muted);
      background: var(--bg-surface);
      border: 1px dashed var(--border-light);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tool-group .tool-card {
      border-left: 3px solid var(--group-color);
    }

    .runner-source {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .runner-panel.src-apoia { border-top: 3px solid var(--src-apoia); }
    .runner-panel.src-trf5 { border-top: 3px solid var(--src-trf5); }

    /* ---------- Visões exclusivas do painel ----------
       Uma só visão por vez (lista, ferramenta, configurações, histórico):
       nada de painéis "esquecidos" abaixo do resultado de outra ferramenta. */
    .apoia-drawer .view-tools,
    .apoia-drawer .runner-panel,
    .apoia-drawer #settingsPanel,
    .apoia-drawer #historyPanel {
      display: none;
    }

    .apoia-drawer[data-view="tools"] .view-tools,
    .apoia-drawer[data-view="runner"] .runner-panel,
    .apoia-drawer[data-view="settings"] #settingsPanel,
    .apoia-drawer[data-view="history"] #historyPanel {
      display: flex;
    }

    .apoia-drawer:not([data-view="tools"]) .drawer-nav {
      display: none;
    }

    .view-tools {
      flex-direction: column;
      gap: 14px;
    }

    .panel-head {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
    }

    .panel-sub {
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .settings-alert {
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      border-radius: var(--radius-sm);
      color: var(--danger-text);
      padding: 8px 10px;
      font-size: 11.5px;
      display: flex;
      align-items: flex-start;
      gap: 6px;
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
      font-family: inherit;
      cursor: pointer;
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

    .btn-back {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      padding: 0;
      color: var(--primary-accent);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
    }

    .btn-back:hover {
      text-decoration: underline;
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

    .results-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-icon-sm {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      padding: 3px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon-sm:hover {
      background: var(--bg-surface);
      color: var(--text-main);
      border-color: var(--border-color);
    }

    .btn-icon-sm.active {
      background: var(--bg-surface);
      color: var(--primary-accent);
      border-color: var(--border-color);
    }

    /* Modo expandido: os resultados ocupam toda a altura do painel,
       ocultando o formulário acima (só existe na visão da ferramenta). */
    .apoia-drawer.results-maximized .btn-back,
    .apoia-drawer.results-maximized .runner-head,
    .apoia-drawer.results-maximized #dynamicNoticeContainer,
    .apoia-drawer.results-maximized #dynamicFormContainer,
    .apoia-drawer.results-maximized .runner-buttons {
      display: none !important;
    }

    .apoia-drawer.results-maximized .runner-panel {
      flex: 1;
      min-height: 0;
      padding: 0;
      border: none;
      background: transparent;
      gap: 0;
    }

    .apoia-drawer.results-maximized .results-box {
      flex: 1;
      min-height: 0;
      margin-top: 0;
    }

    .apoia-drawer.results-maximized .results-content {
      flex: 1;
      max-height: none;
    }

    /* No modo expandido, o corpo perde o respiro lateral e a linha do tempo
       deixa de ter rolagem própria (uma única rolagem, a do resultado). */
    .apoia-drawer.results-maximized .drawer-body {
      padding: 8px;
      overflow: hidden;
    }

    .apoia-drawer.results-maximized .results-box {
      border-radius: var(--radius-sm);
    }

    .apoia-drawer.results-maximized .proc-timeline {
      max-height: none;
      overflow: visible;
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

    /* Decisões (Julia TRF5) */
    .julia-dec {
      border-left: 3px solid var(--border-color);
      padding: 6px 0 6px 10px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .julia-dec-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--text-muted); }
    .julia-dec-sub { font-size: 11px; color: var(--text-muted); }
    .julia-res {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid currentColor;
    }
    .julia-res.pos { color: var(--text-prazo-val); }
    .julia-res.neg { color: var(--danger-text); }
    .julia-res.neu { color: var(--text-muted); }
    .julia-disp {
      font-size: 11.5px;
      line-height: 1.5;
      color: var(--text-main);
      background: var(--bg-viewer);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 6px 8px;
      white-space: pre-wrap;
      max-height: 160px;
      overflow-y: auto;
    }
    .julia-actions { display: flex; gap: 6px; flex-wrap: wrap; }

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

    .proc-polo-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 2px;
    }

    /* Um mesmo número com vários registros (instâncias, recursos e sistema
       anterior à migração): resumo + abas, uma por registro. */
    .proc-registros-resumo {
      font-size: 11.5px;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .inst-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px;
    }

    .inst-tab {
      background: var(--bg-proc-item);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 7px 9px;
      text-align: left;
      font-family: inherit;
      color: var(--text-main);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .inst-tab:hover {
      border-color: var(--border-light);
      background: var(--bg-hover);
    }

    .inst-tab.active {
      border-color: var(--primary);
      background: var(--bg-card-selected);
      box-shadow: inset 0 0 0 1px var(--primary);
    }

    .inst-tab-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .inst-grau {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .inst-sit {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0 5px;
      border-radius: 3px;
      border: 1px solid currentColor;
      white-space: nowrap;
    }

    .inst-sit.atual { color: var(--ok); }
    .inst-sit.encerrado { color: var(--text-muted); }

    .inst-tab-classe {
      font-size: 11.5px;
      font-weight: 600;
    }

    .inst-tab-meta {
      font-size: 10.5px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .proc-detail {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .proc-detail-head {
      font-size: 11px;
      color: var(--text-muted);
    }

    .proc-detail-head strong {
      color: var(--text-main);
    }

    .proc-movs-container {
      margin-top: 4px;
      border-top: 1px solid var(--border-color);
      padding-top: 8px;
    }

    .proc-movs-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
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

    /* Busca Unificada: cabeçalho de cada autuação, com as partes logo abaixo. */
    .data-table tr.grp-row td {
      background: var(--bg-proc-item);
      border-top: 2px solid var(--border-light);
      padding: 7px 8px;
    }

    .data-table tr.grp-row:first-child td {
      border-top: none;
    }

    .grp-head {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px 8px;
    }

    .grp-info {
      font-size: 11px;
      color: var(--text-muted);
      flex: 1;
      min-width: 160px;
    }

    .grp-acao {
      margin-left: auto;
      font-size: 11px;
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
      // As consultas TRF5 aparecem já na abertura; as do Apoia chegam com o tools/list.
      this.tools = [...LOCAL_TOOLS];
      this.lastResult = null;
      this.currentResultView = 'visual';
      this.history = GM_getValue(STORAGE_KEYS.HISTORY, []);
      this.currentLoadedPieceText = '';
      this.currentTheme = GM_getValue(STORAGE_KEYS.THEME, 'dark');
      // Visão atual do painel: 'tools' | 'runner' | 'settings' | 'history'.
      this.view = 'tools';
      this.returnView = 'tools';
      // Conexão com o Apoia MCP: 'loading' | 'ok' | 'expired' | 'error'.
      this.apoiaStatus = 'loading';
      this.apoiaMsg = '';

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
        <div class="apoia-drawer" id="drawer" style="width: ${savedWidth};" data-theme="${this.currentTheme}" data-view="tools">
          <div class="drawer-resizer" id="drawerResizer" title="Arraste para redimensionar o painel"></div>

          <div class="drawer-header">
            <div class="drawer-title-group">
              <div class="title-icon">${ICONS.justice}</div>
              <div class="title-text">Apoia MCP</div>
              <span class="title-badge">Alt + M</span>
            </div>
            <div class="drawer-actions">
              <button class="btn-icon" id="btnThemeToggle" title="Alterar Tema: Escuro / Claro / Sépia">${ICONS.moon}</button>
              <button class="btn-icon" id="btnSettings" title="Configurações (token do Apoia e tema)">${ICONS.settings}</button>
              <button class="btn-icon" id="btnHistory" title="Histórico de Consultas">${ICONS.history}</button>
              <button class="btn-icon" id="btnClose" title="Fechar (Esc)">${ICONS.x}</button>
            </div>
          </div>

          <div class="drawer-nav" id="drawerNav">
            <button class="nav-tab active" data-tab="all">Todas</button>
            <button class="nav-tab" data-tab="processos">Processos & Peças</button>
            <button class="nav-tab" data-tab="jurisprudencia">Jurisprudência</button>
            <button class="nav-tab" data-tab="prazos">Prazos & Datas</button>
            <button class="nav-tab" data-tab="calculo">Cálculos</button>
          </div>

          <div class="drawer-body" id="drawerBody">
            <div class="view-tools">
              <div class="search-box">
                ${ICONS.search}
                <input type="text" id="toolSearchInput" placeholder="Filtrar ferramentas..." />
              </div>

              <div class="tools-list" id="toolsList"></div>
            </div>

            <div class="runner-panel" id="runnerPanel">
              <button type="button" class="btn-back" id="btnBackToTools" title="Voltar à lista de ferramentas (Esc)">← Ferramentas</button>
              <div class="runner-head">
                <div class="runner-source" id="runnerSource"></div>
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
                  <div class="results-header-actions">
                    <div class="results-tabs">
                      <button class="tab-btn active" data-view="visual">Visual</button>
                      <button class="tab-btn" data-view="markdown">Markdown</button>
                      <button class="tab-btn" data-view="json">JSON</button>
                    </div>
                    <button class="btn-icon-sm" id="btnMaximizeResults" title="Expandir resultados para ocupar todo o painel">${ICONS.maximize}</button>
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

            <div class="settings-box" id="settingsPanel">
              <div class="panel-head">
                <button type="button" class="btn-back" data-panel-back title="Voltar (Esc)">← Voltar</button>
                <div class="panel-title">Configurações</div>
                <div class="panel-sub">O token vale só para as ferramentas <span class="src-chip src-apoia">Apoia MCP</span>. As consultas <span class="src-chip src-trf5">TRF5</span> (Julia e Busca Unificada) são públicas e funcionam sem ele.</div>
              </div>
              <div class="settings-alert" id="settingsAlert" style="display: none;">${ICONS.alert} <span id="settingsAlertText"></span></div>

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

            <div class="settings-box" id="historyPanel">
              <div class="panel-head">
                <button type="button" class="btn-back" data-panel-back title="Voltar (Esc)">← Voltar</button>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="panel-title">Histórico de Consultas</div>
                  <button class="btn btn-secondary" id="btnClearHistory" style="padding: 3px 6px; font-size: 11px;">Limpar</button>
                </div>
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

    // Devolve true se o Apoia MCP respondeu. Com token recusado, abre as
    // Configurações — só se o usuário ainda estiver na lista de ferramentas,
    // para não arrancá-lo de uma consulta pública (Julia/TRF5) em andamento.
    async loadTools({ abrirConfigSeExpirado = true } = {}) {
      this.updateTokenStatus('loading');
      try {
        const rawTools = await this.client.listTools();
        this.tools = [...LOCAL_TOOLS, ...rawTools];
        this.updateTokenStatus('ok');
        return true;
      } catch (err) {
        console.warn('[Apoia MCP] Erro ao carregar ferramentas:', err);
        // As ferramentas locais (Julia, Busca Unificada) não dependem do token do Apoia.
        this.tools = [...LOCAL_TOOLS];
        if (err.isAuthError) {
          this.updateTokenStatus('expired', 'Token expirado ou inválido');
          if (abrirConfigSeExpirado && this.view === 'tools') {
            this.openSettingsPanel({ focusToken: true, alerta: 'Seu token do Apoia expirou ou é inválido. Cole um novo token abaixo — as consultas TRF5 continuam disponíveis enquanto isso.' });
          }
        } else {
          this.updateTokenStatus('error', err.message || 'Falha ao conectar ao Apoia MCP');
        }
        return false;
      }
    }

    // Troca a visão do painel. Configurações e Histórico lembram de onde o
    // usuário veio (lista ou ferramenta, com o resultado preservado) para o "Voltar".
    setView(view) {
      const painel = (v) => v === 'settings' || v === 'history';
      if (painel(view) && !painel(this.view)) this.returnView = this.view;
      this.view = view;

      const drawer = this.shadow.getElementById('drawer');
      drawer.dataset.view = view;
      if (view !== 'runner') this.toggleMaximizeResults(false);
      this.shadow.getElementById('btnSettings').classList.toggle('active', view === 'settings');
      this.shadow.getElementById('btnHistory').classList.toggle('active', view === 'history');
      this.shadow.getElementById('drawerBody').scrollTop = 0;
    }

    closePanel() {
      this.setView(this.returnView === 'runner' && this.selectedTool ? 'runner' : 'tools');
    }

    // Exibe as Configurações e, opcionalmente, um alerta e o cursor no campo
    // de token para renovação rápida.
    openSettingsPanel({ focusToken = false, alerta = '' } = {}) {
      const tokenInput = this.shadow.getElementById('cfgTokenInput');

      this.setView('settings');
      this.setSettingsAlert(alerta);
      tokenInput.value = this.client.token;
      this.shadow.getElementById('cfgUrlInput').value = this.client.baseUrl;
      this.shadow.getElementById('cfgThemeSelect').value = this.currentTheme;

      if (focusToken && this.isOpen) {
        tokenInput.focus();
        tokenInput.select();
      }
    }

    setSettingsAlert(msg) {
      this.shadow.getElementById('settingsAlert').style.display = msg ? 'flex' : 'none';
      this.shadow.getElementById('settingsAlertText').textContent = msg || '';
    }

    updateTokenStatus(status, msg = '') {
      this.apoiaStatus = status;
      this.apoiaMsg = msg;
      const btn = this.shadow.getElementById('btnSettings');
      const alerta = status === 'expired' || status === 'error';
      btn.classList.toggle('has-alert', alerta);
      btn.title = alerta
        ? `Configurações — ${msg || 'token do Apoia com problema'}`
        : 'Configurações (token do Apoia e tema)';
      this.renderToolsGrid(this.shadow.getElementById('toolSearchInput').value);
      if (this.view === 'runner' && this.selectedTool) this.renderRunnerSource(this.selectedTool);
    }

    apoiaStatusHtml() {
      const esc = (s) => this.escapeHtml(String(s ?? ''));
      if (this.apoiaStatus === 'ok') return `<span class="group-status ok">Conectado</span>`;
      if (this.apoiaStatus === 'loading') return `<span class="group-status">Conectando…</span>`;
      if (this.apoiaStatus === 'expired') return `<span class="group-status expired">Token expirado</span>`;
      return `<span class="group-status error" title="${esc(this.apoiaMsg)}">Sem conexão</span>`;
    }

    // Lista de ferramentas em dois blocos: Apoia MCP (com token) e TRF5 (públicas).
    renderToolsGrid(filterText = '') {
      const list = this.shadow.getElementById('toolsList');
      list.innerHTML = '';
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

      const grupos = [
        {
          id: 'apoia',
          classe: 'src-apoia',
          titulo: 'Apoia MCP',
          sub: 'Ferramentas do PDPJ · usam o seu token',
          extra: `${this.apoiaStatusHtml()}<a class="group-link" href="${TOKEN_PORTAL_URL}" target="_blank" rel="noopener noreferrer" title="Abre a página oficial para gerar ou renovar seu token">Renovar token ${ICONS.externalLink}</a>`
        },
        {
          id: 'trf5',
          classe: 'src-trf5',
          titulo: 'TRF5 · consultas públicas',
          sub: 'Julia e Portal BI · funcionam sem o token do Apoia',
          extra: ''
        }
      ];

      let exibidos = 0;
      grupos.forEach(g => {
        const tools = filtered.filter(t => fonteDe(t).grupo === g.id);
        // Sem token, as ferramentas do Apoia nem chegam a ser listadas: o bloco
        // fica visível com o aviso, para o usuário saber o que está faltando.
        const apoiaIndisponivel = g.id === 'apoia' && this.apoiaStatus !== 'ok' && !search;
        if (!tools.length && !apoiaIndisponivel) return;

        const el = document.createElement('div');
        el.className = `tool-group ${g.classe}`;
        el.innerHTML = `
          <div class="tool-group-head">
            <span class="tool-group-title">${g.titulo}</span>
            <span class="tool-group-sub">${g.sub}</span>
            ${g.extra}
          </div>
        `;

        if (tools.length) {
          const grid = document.createElement('div');
          grid.className = 'tools-grid';
          tools.forEach(tool => {
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
          el.appendChild(grid);
          exibidos += tools.length;
        } else {
          const vazio = document.createElement('div');
          vazio.className = 'group-empty';
          vazio.innerHTML = this.apoiaStatus === 'loading'
            ? `<div class="loader"></div> Carregando as ferramentas do Apoia MCP…`
            : `${ICONS.key} <span>${this.apoiaStatus === 'expired' ? 'Token expirado ou inválido: as ferramentas do Apoia não estão disponíveis.' : this.escapeHtml(this.apoiaMsg || 'Não foi possível conectar ao Apoia MCP.')}</span> <button class="group-link" type="button">Informar token</button>`;
          vazio.querySelector('button')?.addEventListener('click', () => this.openSettingsPanel({ focusToken: true }));
          el.appendChild(vazio);
        }
        list.appendChild(el);
      });

      if (!exibidos && search) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 16px;">Nenhuma ferramenta encontrada.</div>`;
      }
    }

    // Linha de origem no topo da ferramenta: deixa explícito de onde vêm os
    // dados e se o token do Apoia está em jogo.
    renderRunnerSource(tool) {
      const fonte = fonteDe(tool);
      let nota = fonte.nota;
      if (fonte.grupo === 'apoia') {
        nota += this.apoiaStatus === 'ok' ? ' · conectado'
          : this.apoiaStatus === 'loading' ? ' · conectando…'
          : this.apoiaStatus === 'expired' ? ' · token expirado' : ' · sem conexão';
      }
      this.shadow.getElementById('runnerSource').innerHTML =
        `<span class="src-chip ${fonte.classe}">${fonte.rotulo}</span><span>${this.escapeHtml(nota)}</span>`;
      const runner = this.shadow.getElementById('runnerPanel');
      runner.classList.remove('src-apoia', 'src-trf5');
      runner.classList.add(fonte.classe);
    }

    selectTool(tool) {
      this.selectedTool = tool;
      this.setView('runner');

      const runnerTitle = this.shadow.getElementById('runnerTitle');
      const runnerDesc = this.shadow.getElementById('runnerDesc');
      const noticeContainer = this.shadow.getElementById('dynamicNoticeContainer');
      const meta = TOOL_META[tool.name] || {};

      this.renderRunnerSource(tool);
      runnerTitle.textContent = meta.displayName || tool.name;
      runnerDesc.textContent = tool.description || '';

      if (meta.helpNotice) {
        noticeContainer.innerHTML = `
          <div class="info-notice">
            <div>${meta.helpNotice}</div>
            <div>
              <a href="${meta.helpUrl || LIBRARY_PORTAL_URL}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-accent); font-weight: 600; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
                ${meta.helpUrlLabel || 'Acessar Portal Apoia PDPJ'} ${ICONS.externalLink}
              </a>
            </div>
          </div>
        `;
      } else {
        noticeContainer.innerHTML = '';
      }

      this.renderDynamicForm(tool);
      this.shadow.getElementById('resultsBox').style.display = 'none';
      this.toggleMaximizeResults(false);
    }

    backToToolsList() {
      this.selectedTool = null;
      this.setView('tools');
      this.shadow.getElementById('resultsBox').style.display = 'none';
      this.renderToolsGrid(this.shadow.getElementById('toolSearchInput').value);
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
      const fonte = !this.selectedTool.local
        ? 'Processando requisição no Apoia MCP...'
        : (this.selectedTool.name === 'buscaProcessualUnificada' ? 'Consultando o painel do TRF5...' : 'Consultando a Julia (TRF5)...');
      resultsContent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: var(--text-muted);"><div class="loader"></div> ${fonte}</div>`;

      resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
        const args = this.getFormValues();
        const res = this.selectedTool.local
          ? await this.runLocalTool(this.selectedTool.name, args)
          : await this.client.callTool(this.selectedTool.name, args);
        this.lastResult = res;

        resultsTime.textContent = `${res.durationMs}ms`;
        this.renderResultView();
        this.saveToHistory(this.selectedTool.name, args, res);
        resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        console.error('[Apoia MCP] Falha na execução:', err);
        resultsTime.textContent = 'Erro';
        // Sem isso, as abas JSON/Markdown voltariam a exibir o resultado anterior.
        this.lastResult = null;

        if (err.isAuthError) {
          this.updateTokenStatus('expired', 'Token expirado ou inválido (401)');
          resultsContent.innerHTML = `
            <div class="error-card">
              <div class="error-card-title">${ICONS.alert} Token expirado ou não autorizado</div>
              <div class="error-card-body">Seu token expirou ou não está autorizado. Obtenha um novo token no portal do Apoia e cole-o nas Configurações; ao salvar, você volta para esta ferramenta.</div>
              <div style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="token-link-btn" data-abrir-config>${ICONS.key} Informar novo token</button>
                <a href="${TOKEN_PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="token-link-btn">Renovar no portal do Apoia ${ICONS.externalLink}</a>
              </div>
            </div>
          `;
          resultsContent.querySelector('[data-abrir-config]').addEventListener('click', () => this.openSettingsPanel({ focusToken: true }));
          this.openSettingsPanel({ focusToken: true, alerta: `O Apoia recusou o token ao executar "${(TOOL_META[this.selectedTool.name] || {}).displayName || this.selectedTool.name}". Cole um novo token e salve para voltar à ferramenta.` });
        } else {
          const info = this.selectedTool?.local
            ? { title: this.selectedTool.name === 'buscaProcessualUnificada' ? 'Falha ao consultar o painel do TRF5' : 'Falha ao consultar a Julia (TRF5)', body: err.message || 'Erro desconhecido' }
            : this.interpretServiceError(err.message || 'Falha ao executar ferramenta no servidor Apoia');
          resultsContent.innerHTML = `
            <div class="error-card">
              <div class="error-card-title">${ICONS.alert} ${this.escapeHtml(info.title)}</div>
              <div class="error-card-body">${this.escapeHtml(info.body)}</div>
            </div>
          `;
          this.appendRetryButton(resultsContent, () => this.executeCurrentTool());
          resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    // Traduz erros técnicos repassados pelo Apoia em mensagens amigáveis.
    interpretServiceError(raw) {
      const t = String(raw || '');
      if (/JURISPRUDENCIA_URL|n[ãa]o configurada para o seu tribunal/i.test(t)) {
        return {
          title: 'Indisponível para o seu tribunal',
          body: 'O Apoia ainda não tem base de jurisprudência configurada para o seu tribunal (JURISPRUDENCIA_URL), por isso Precedentes Jurisprudenciais e Inteiro Teor não funcionam na sua conta. Não é problema de token nem da sua consulta — depende da configuração do Apoia. Para decisões do TRF5, use "Decisões (Julia TRF5)".'
        };
      }
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
      } else if (toolName === 'juliaDecisions') {
        this.renderJuliaDecisions(body, data);
      } else if (toolName === 'buscaProcessualUnificada') {
        this.renderBuscaUnificada(body, data);
      } else if (toolName === 'precedentFullText') {
        this.renderPrecedentFullText(body, data);
      } else if (toolName === 'piecesText') {
        this.renderPiecesText(body, data);
      } else if (toolName === 'libraryDocument') {
        this.renderLibraryDocument(body, data);
      } else if (toolName === 'pangea' || toolName === 'semanticSearch' || toolName === 'precedent' || toolName === 'leadingCaseSearch') {
        this.renderJurisprudenceCards(body, data, toolName);
      } else if (toolName === 'dateDiff' || toolName === 'addDate' || toolName === 'currentDate') {
        this.renderDateResult(body, toolName, data);
      } else if (toolName === 'calculator') {
        this.renderCalculatorResult(body, data);
      } else {
        this.renderGenericData(body, data);
      }
    }

    // Resume um registro do processMetadata. O PJe devolve um registro por
    // instância/recurso — e mais um do sistema anterior, quando houve
    // migração —, todos com o mesmo número (ex.: 1º grau atual, 1º grau
    // migrado, apelação de 2021 e apelação de 2026).
    resumirRegistroProcesso(proc) {
      const movs = (proc.movimentosEDocumentos || [])
        .map(m => ({ ...m, descricao: corrigirMojibake(m.descricao) }))
        // Mais recentes primeiro: "Recentes" passa a mostrar de fato as últimas.
        .sort((a, b) => String(b.dataHora || '').localeCompare(String(a.dataHora || '')));
      const segundoGrau = proc.instancia === 'SEGUNDO_GRAU';
      const grau = proc.instancia === 'PRIMEIRO_GRAU' ? '1º grau'
        : segundoGrau ? '2º grau'
        : (proc.instancia ? proc.instancia.replace(/_/g, ' ').toLowerCase() : 'Instância não informada');
      const orgao = movs.find(m => m.orgaoJulgador)?.orgaoJulgador || '';
      const fim = movs[0]?.dataHora || '';
      // No 2º grau o registro costuma trazer o histórico do 1º grau copiado
      // (sem órgão julgador); o recurso começa na primeira movimentação com órgão.
      const maisAntiga = (segundoGrau && [...movs].reverse().find(m => m.orgaoJulgador)) || movs[movs.length - 1];
      const inicio = maisAntiga?.dataHora || proc.informacoesGerais?.dataAjuizamento || '';
      const recentes = movs.slice(0, 3).map(m => m.descricao || m.tipo?.nome || '');
      let situacao = '';
      if (/migrad[ao] a tramita/i.test(recentes[0] || '')) situacao = 'Migrado';
      else if (/remetidos? os autos.*(1º|primeiro)\s*grau/i.test(recentes[0] || '')) situacao = 'Devolvido ao 1º grau';
      else if (recentes.some(d => /baixa definitiva/i.test(d))) situacao = 'Baixa definitiva';
      else if (/arquivad/i.test(recentes[0] || '')) situacao = 'Arquivado';
      return { proc, movs, grau, orgao, inicio, fim, situacao };
    }

    renderProcessMetadata(container, data) {
      const list = (Array.isArray(data) ? data : [data]).filter(p => p && typeof p === 'object');
      if (list.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 16px;">Nenhum metadado processual encontrado.</div>`;
        return;
      }

      // Agrupa os registros pelo número: um cartão por processo.
      const grupos = new Map();
      list.forEach((proc, i) => {
        const chave = String(proc.numeroProcesso || '').replace(/\D/g, '') || `sem-numero-${i}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(this.resumirRegistroProcesso(proc));
      });

      grupos.forEach(registros => {
        // Atividade mais recente primeiro: a primeira aba é onde o processo está agora.
        registros.sort((a, b) => String(b.fim).localeCompare(String(a.fim)));
        container.appendChild(this.buildProcessGroupCard(registros));
      });
    }

    buildProcessGroupCard(registros) {
      const esc = (s) => this.escapeHtml(String(s ?? ''));
      const base = registros[0].proc;
      const num = formatarCnj(base.numeroProcesso) || 'Processo sem número';
      const tribunal = base.tribunal?.sigla ? `${base.tribunal.sigla} · ${base.tribunal.nome || ''}` : 'Tribunal não informado';

      const card = document.createElement('div');
      card.className = 'proc-card';
      card.innerHTML = `
        <div class="proc-header">
          <div>
            <div class="proc-num">${esc(num)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${esc(tribunal)}</div>
          </div>
          <span class="badge-court">${esc(base.tribunal?.sigla || 'JUDICIAL')}</span>
        </div>
      `;

      const detalhe = document.createElement('div');
      detalhe.className = 'proc-detail';

      if (registros.length > 1) {
        const porGrau = {};
        registros.forEach(r => { porGrau[r.grau] = (porGrau[r.grau] || 0) + 1; });
        const contagem = Object.entries(porGrau).map(([g, n]) => `${n} no ${g}`).join(', ');
        card.insertAdjacentHTML('beforeend', `
          <div class="proc-registros-resumo">
            <strong>${registros.length} registros</strong> para este número (${esc(contagem)}): o PJe guarda um por instância e por recurso — e outro do sistema anterior, quando há migração. Escolha abaixo; o primeiro é o de movimentação mais recente.
          </div>
        `);

        const abas = document.createElement('div');
        abas.className = 'inst-tabs';
        registros.forEach((r, i) => {
          const aba = document.createElement('button');
          aba.type = 'button';
          aba.className = `inst-tab ${i === 0 ? 'active' : ''}`;
          const sit = i === 0 && !r.situacao
            ? `<span class="inst-sit atual">Mais recente</span>`
            : (r.situacao ? `<span class="inst-sit encerrado">${esc(r.situacao)}</span>` : '');
          aba.innerHTML = `
            <span class="inst-tab-top"><span class="inst-grau">${esc(r.grau)}</span>${sit}</span>
            <span class="inst-tab-classe">${esc(r.proc.classe?.descricao || 'Classe não informada')}</span>
            <span class="inst-tab-meta" title="${esc(r.orgao)}">${esc(r.orgao || 'Órgão não informado')}</span>
            <span class="inst-tab-meta">${esc(mesAno(r.inicio))} – ${esc(mesAno(r.fim))} · ${r.movs.length} mov.</span>
          `;
          aba.addEventListener('click', () => {
            abas.querySelectorAll('.inst-tab').forEach(a => a.classList.remove('active'));
            aba.classList.add('active');
            this.renderProcessDetail(detalhe, r, true);
          });
          abas.appendChild(aba);
        });
        card.appendChild(abas);
      }

      card.appendChild(detalhe);
      this.renderProcessDetail(detalhe, registros[0], registros.length > 1);
      return card;
    }

    renderProcessDetail(detalhe, registro, multiplos) {
      const esc = (s) => this.escapeHtml(String(s ?? ''));
      const { proc, movs: allMovs, grau, orgao } = registro;
      const num = String(proc.numeroProcesso || '');
      const segundoGrau = proc.instancia === 'SEGUNDO_GRAU';

      const classe = proc.classe?.descricao ? `${proc.classe.descricao} (Cód. ${proc.classe.codigo})` : 'Não informada';
      const assuntos = [...new Set((proc.assuntos || []).map(a => a.descricao).filter(Boolean))];
      const assunto = assuntos.length ? assuntos.join(', ') : 'Não informado';

      let valorCausa = 'Não informado';
      if (proc.informacoesGerais?.valorAcao !== undefined && proc.informacoesGerais?.valorAcao !== null) {
        valorCausa = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.informacoesGerais.valorAcao);
      }

      const ajuizamento = formatarDataIso(proc.informacoesGerais?.dataAjuizamento) || 'Não informada';

      const polo = (partes, padrao) => partes && partes.length > 0
        ? partes.map(p => `<div><strong>${esc(p.tipo || padrao)}:</strong> ${esc(p.nome)}</div>`).join('')
        : `<div style="color: var(--text-dim);">Não detalhado</div>`;

      detalhe.innerHTML = `
        <div class="proc-detail-head">
          <strong>${esc(grau)}</strong>${orgao ? ' · ' + esc(orgao) : ''}${multiplos ? '' : ` · ${allMovs.length} movimentações`}
        </div>

        <div class="proc-grid">
          <div class="proc-item">
            <div class="proc-item-label">Classe Processual</div>
            <div class="proc-item-val">${esc(classe)}</div>
          </div>
          <div class="proc-item">
            <div class="proc-item-label">${assuntos.length > 1 ? 'Assuntos' : 'Assunto Principal'}</div>
            <div class="proc-item-val">${esc(assunto)}</div>
          </div>
          <div class="proc-item">
            <div class="proc-item-label">Valor da Causa</div>
            <div class="proc-item-val" style="color: var(--text-prazo-val); font-family: var(--font-mono);">${esc(valorCausa)}</div>
          </div>
          <div class="proc-item">
            <div class="proc-item-label">${segundoGrau ? 'Autuação' : 'Data de Ajuizamento'}</div>
            <div class="proc-item-val">${esc(ajuizamento)}</div>
          </div>
        </div>

        <div class="proc-parties">
          <div>
            <div class="proc-polo-label">Polo ativo</div>
            ${polo(proc.partes?.poloAtivo, 'AUTOR')}
          </div>
          <div style="border-top: 1px solid var(--border-color); padding-top: 4px; margin-top: 2px;">
            <div class="proc-polo-label">Polo passivo</div>
            ${polo(proc.partes?.poloPassivo, 'RÉU')}
          </div>
        </div>

        <div class="proc-movs-container">
          <div class="proc-movs-header">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-main);">
              Movimentações & Peças (${allMovs.length}) <span style="font-weight: 400; color: var(--text-dim);">· mais recentes primeiro</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <input type="text" class="proc-movs-filter" placeholder="Filtrar eventos..." />
              <button class="btn btn-secondary btn-small btn-toggle-movs"></button>
            </div>
          </div>
          <div class="proc-timeline"></div>
        </div>
      `;

      const timelineEl = detalhe.querySelector('.proc-timeline');
      const filterInput = detalhe.querySelector('.proc-movs-filter');
      const toggleBtn = detalhe.querySelector('.btn-toggle-movs');
      // No modo expandido a linha do tempo já começa completa.
      let showAll = this.shadow.getElementById('drawer').classList.contains('results-maximized');
      const MOVS_RECENTES = 8;

      const updateToggleLabel = () => {
        toggleBtn.style.display = allMovs.length > MOVS_RECENTES ? '' : 'none';
        toggleBtn.textContent = showAll ? `Ver Recentes (${MOVS_RECENTES})` : `Ver Todas (${allMovs.length})`;
      };

      const renderTimelineItems = () => {
        timelineEl.innerHTML = '';
        const filterTerm = filterInput.value.toLowerCase().trim();

        const filtered = allMovs.filter(m => {
          if (!filterTerm) return true;
          const desc = (m.descricao || m.tipo?.nome || '').toLowerCase();
          const docs = (m.documentos || []).map(d => (d.nome + ' ' + d.tipoDocumento).toLowerCase()).join(' ');
          return desc.includes(filterTerm) || docs.includes(filterTerm);
        });

        // Com filtro ativo, exibe todas as correspondências (a busca já varre
        // o processo inteiro, não faz sentido cortar em 8).
        const itemsToDisplay = (showAll || filterTerm) ? filtered : filtered.slice(0, MOVS_RECENTES);

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
                    <div class="doc-info" title="${esc(doc.nome)} (${esc(doc.tipoDocumento || '')})">
                      ${ICONS.docText}
                      <span>${esc(doc.nome || 'Documento')}</span>
                      ${doc.quantidadePaginas ? `<span style="color: var(--text-dim); font-size: 10px;">(${doc.quantidadePaginas} pág.)</span>` : ''}
                    </div>
                    <button class="doc-btn-view" data-doc-id="${esc(doc.id)}" data-doc-name="${esc(doc.nome || 'Documento')}" data-proc="${esc(num)}">
                      ${ICONS.file} Ler Peça
                    </button>
                  </div>
                `).join('')}
              </div>
            `;
          }

          eventDiv.innerHTML = `
            <div class="timeline-date">${esc(dateStr)} ${m.responsavel ? '· ' + esc(m.responsavel) : ''}</div>
            <div class="timeline-desc">${esc(m.descricao || m.tipo?.nome || 'Movimentação')}</div>
            ${docsHtml}
          `;

          eventDiv.querySelectorAll('.doc-btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
              this.openPieceViewer(btn.dataset.proc, btn.dataset.docId, btn.dataset.docName);
            });
          });

          timelineEl.appendChild(eventDiv);
        });
      };

      filterInput.addEventListener('input', () => renderTimelineItems());
      toggleBtn.addEventListener('click', () => {
        showAll = !showAll;
        updateToggleLabel();
        renderTimelineItems();
      });
      // Expandir/recolher o painel alterna junto entre todas e recentes. O
      // contêiner é reaproveitado entre abas: troca o ouvinte da aba anterior.
      detalhe.classList.add('has-movs-toggle');
      if (detalhe._apoiaMaximize) detalhe.removeEventListener('apoia-maximize', detalhe._apoiaMaximize);
      detalhe._apoiaMaximize = (e) => {
        if (showAll === e.detail) return;
        showAll = e.detail;
        updateToggleLabel();
        renderTimelineItems();
      };
      detalhe.addEventListener('apoia-maximize', detalhe._apoiaMaximize);

      updateToggleLabel();
      renderTimelineItems();
    }

    // Ferramentas locais (sem MCP): devolvem o mesmo formato de callTool.
    async runLocalTool(name, args) {
      const inicio = performance.now();
      let data;
      if (name === 'juliaDecisions') data = await executarJuliaDecisions(args);
      else if (name === 'buscaProcessualUnificada') data = await executarBuscaProcessualUnificada(args);
      else throw { message: `Ferramenta local desconhecida: ${name}` };
      return {
        raw: null,
        data,
        text: this.convertToMarkdown(name, data),
        durationMs: Math.round(performance.now() - inicio)
      };
    }

    juliaResultadoClasse(resultado) {
      if (/^(PROCEDENTE|PROVIDO|PARCIALMENTE)/.test(resultado)) return 'pos';
      if (/^(IMPROCEDENTE|NÃO PROVIDO|NÃO CONHECIDO|EXTINTO)/.test(resultado)) return 'neg';
      return 'neu';
    }

    renderJuliaDecisions(container, data) {
      const processos = data?.processos || [];
      const esc = (s) => this.escapeHtml(String(s ?? ''));

      // Quadro comparativo quando há mais de um processo (análise de conexos).
      if (processos.length > 1) {
        const linhas = processos.flatMap(p => (p.documentos.length ? p.documentos : [null]).map(d => `
          <tr>
            <td style="font-family: var(--font-mono); white-space: nowrap;">${esc(p.numeroProcesso)}</td>
            <td>${d ? esc(d.tipoLabel) + ' · ' + esc(d.instancia) : (p.erro ? `<span style="color: var(--danger);">Erro</span>` : '<span style="color: var(--text-dim);">Nada indexado</span>')}</td>
            <td style="white-space: nowrap;">${d ? esc(formatarDataIso(d.dataJulgamento)) : ''}</td>
            <td>${d?.resultado ? `<span class="julia-res ${this.juliaResultadoClasse(d.resultado)}">${esc(d.resultado)}</span>` : ''}</td>
          </tr>`)).join('');
        const quadro = document.createElement('div');
        quadro.className = 'proc-card';
        quadro.innerHTML = `
          <div class="proc-header">
            <div style="font-size: 13px; font-weight: 700; color: var(--primary-accent);">Quadro comparativo</div>
            <span class="badge-court">${processos.length} PROCESSOS</span>
          </div>
          <table class="data-table">
            <thead><tr><th>Processo</th><th>Decisão</th><th>Julgamento</th><th>Resultado</th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
          ${data.ignorados ? `<div class="julia-dec-sub">${data.ignorados} número(s) além do limite de ${JULIA_MAX_PROCESSOS} não foram consultados.</div>` : ''}
        `;
        container.appendChild(quadro);
      }

      processos.forEach(p => {
        const card = document.createElement('div');
        card.className = 'proc-card';
        const instancias = [...new Set(p.documentos.map(d => d.instancia).filter(Boolean))].join(' → ');
        card.innerHTML = `
          <div class="proc-header">
            <div>
              <div class="proc-num">${esc(p.numeroProcesso)}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${p.documentos.length} decisão(ões) indexada(s)${instancias ? ' · ' + esc(instancias) : ''}</div>
            </div>
            <span class="badge-court">JULIA</span>
          </div>
        `;

        if (p.erro) {
          card.insertAdjacentHTML('beforeend', `<div class="error-card"><div class="error-card-body">${esc(p.erro)}</div></div>`);
        } else if (p.documentos.length === 0) {
          card.insertAdjacentHTML('beforeend', `<div class="julia-dec-sub" style="padding: 6px 0;">Nenhuma decisão indexada na Julia para este número (a Julia cobre só documentos do PJe da 5ª Região).</div>`);
        }

        p.documentos.forEach(d => {
          const el = document.createElement('div');
          el.className = 'julia-dec';
          const magistrado = d.relatorAcordao ? `${d.relator} · Rel. p/ acórdão: ${d.relatorAcordao}` : d.relator;
          el.innerHTML = `
            <div class="julia-dec-head">
              <span class="badge-type">${esc(d.tipoLabel)}</span>
              <span class="badge-court">${esc(d.orgao)} · ${esc(d.instancia)}</span>
              ${d.resultado ? `<span class="julia-res ${this.juliaResultadoClasse(d.resultado)}">${esc(d.resultado)}</span>` : ''}
              ${d.votacao ? `<span class="badge-status">${esc(d.votacao)}</span>` : ''}
              <span>${esc(formatarDataIso(d.dataJulgamento))}</span>
            </div>
            <div class="julia-dec-sub">${esc(d.orgaoJulgador)} · ${esc(d.classeJudicial)}${magistrado ? ' · ' + esc(magistrado) : ''}</div>
            ${d.dispositivo ? `<div class="julia-disp">${esc(d.dispositivo)}</div>` : '<div class="julia-dec-sub" style="font-style: italic;">Dispositivo não localizado automaticamente — veja a íntegra.</div>'}
            <div class="julia-actions">
              <button class="doc-btn-view" data-acao="ler">${ICONS.file} Ler íntegra</button>
              <button class="doc-btn-view" data-acao="copiar">${ICONS.copy} Copiar íntegra</button>
            </div>
          `;
          el.querySelector('[data-acao="ler"]').addEventListener('click', () => {
            this.openTextViewer(`${d.tipoLabel} — ${d.orgaoJulgador || ''}`, `Processo ${p.numeroProcesso} · ${formatarDataIso(d.dataJulgamento)} · Julia TRF5`, d.texto + (d.citacao ? `\n\n${d.citacao}` : ''));
          });
          el.querySelector('[data-acao="copiar"]').addEventListener('click', () => {
            GM_setClipboard(d.texto);
            this.showToast('Íntegra copiada para a área de transferência.');
          });
          card.appendChild(el);
        });

        container.appendChild(card);
      });
    }

    // Busca Processual Unificada (painel Qlik): tabela com as mesmas colunas da tela.
    renderBuscaUnificada(container, data) {
      const esc = (s) => this.escapeHtml(String(s ?? ''));
      const linhas = data?.linhas || [];
      const colunas = data?.colunas || [];
      const card = document.createElement('div');
      card.className = 'proc-card';

      const cabecalho = `
        <div class="proc-header">
          <div>
            <div class="proc-num">Busca Processual Unificada</div>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${esc(data?.campo)} = ${esc(data?.termo)} · ${esc(String(data?.total ?? 0))} registro(s)
            </div>
          </div>
          <span class="badge-court">TRF5 · 1º/2º GRAU</span>
        </div>`;

      if (!linhas.length) {
        card.innerHTML = cabecalho + `<div class="julia-dec-sub" style="font-style: italic;">Nenhum registro encontrado neste painel. Ele cobre 1º e 2º grau da 5ª Região (PJe, PJe 2.x, Creta, Tebas, SEEU, Esparta), com carga diária do Portal BI.</div>`;
        container.appendChild(card);
        return;
      }

      // O painel devolve uma linha por parte × autuação: o mesmo processo
      // aparece em várias autuações (1º grau, recurso no 2º grau, sistema
      // anterior à migração), cada uma repetindo número, classe e sistema em
      // todas as partes. Agrupa por autuação: cabeçalho com os dados do
      // processo e, abaixo, só as partes.
      const PARTE = ['Nome', 'Sujeito Processual', 'Pessoa', 'CPF/CNPJ'];
      const idx = (t) => colunas.indexOf(t);
      const val = (r, t) => (idx(t) >= 0 ? String(r[idx(t)] ?? '') : '');
      const colsAutuacao = colunas.filter(c => !PARTE.includes(c));
      const colsParte = colunas.filter(c => PARTE.includes(c));

      const autuacoes = new Map();
      linhas.forEach(r => {
        const chave = colsAutuacao.map(c => val(r, c)).join('\u0001');
        if (!autuacoes.has(chave)) autuacoes.set(chave, { r, partes: [] });
        autuacoes.get(chave).partes.push(r);
      });

      const dataOrd = (s) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? m[3] + m[2] + m[1] : s; };
      const grupos = [...autuacoes.values()].sort((a, b) =>
        val(a.r, 'Número do Processo').localeCompare(val(b.r, 'Número do Processo')) ||
        val(a.r, 'Grau').localeCompare(val(b.r, 'Grau')) ||
        dataOrd(val(a.r, '1ª Distribuição')).localeCompare(dataOrd(val(b.r, '1ª Distribuição'))) ||
        val(a.r, 'Sistema').localeCompare(val(b.r, 'Sistema')));

      // Polo ativo, polo passivo, demais e, por último, advogados/procuradores.
      const ordemPapel = (p) => /^(AUTOR|REQUERENTE|APELANTE|RECORRENTE|EXEQUENTE|IMPETRANTE|EMBARGANTE|AGRAVANTE)/i.test(p) ? 0
        : /^(R[EÉ]U|REQUERIDO|APELADO|RECORRIDO|EXECUTADO|IMPETRADO|EMBARGADO|AGRAVADO)/i.test(p) ? 1
        : /ADVOGADO|PROCURADOR|DEFENSOR/i.test(p) ? 3 : 2;

      const acaoConsulta = (url, numero) => {
        if (!/^https?:\/\//i.test(url)) return url ? `<span>${esc(url)}</span>` : '';
        if (numero && consultaPjeAutomatizavel(url)) {
          return `<button class="doc-btn-view" data-apoia-acompanhar="1" data-url="${esc(url)}" data-num="${esc(numero)}" title="Abre a consulta pública do sistema numa aba nova, já com o número preenchido, pesquisa disparada e o detalhe do processo aberto.">${ICONS.search} Acompanhar</button>`;
        }
        return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Abre a consulta pública do sistema (${esc(url)}). Este sistema não tem o formulário do PJe — a busca tem de ser feita lá." style="color: var(--primary-accent); font-weight: 600;">Abrir consulta ${ICONS.externalLink}</a>`;
      };

      const celulaParte = (titulo, v) => {
        if (titulo === 'Pessoa') return `<td style="white-space: nowrap;">${esc(v === 'F' ? 'Física' : (v === 'J' ? 'Jurídica' : v))}</td>`;
        if (titulo === 'CPF/CNPJ') return `<td style="white-space: nowrap; font-family: var(--font-mono); font-size: 11px;">${esc(v)}</td>`;
        return `<td>${esc(v)}</td>`;
      };

      const tb = grupos.map(({ r, partes }) => {
        const numero = val(r, 'Número do Processo');
        const classe = val(r, 'Classe Judicial');
        const instancia = val(r, 'Instância');
        const grau = val(r, 'Grau');
        const info = [
          [val(r, 'Sistema'), val(r, 'Seção')].filter(Boolean).join(' · '),
          classe && classe !== '-' ? classe : 'Classe não informada',
          val(r, '1ª Distribuição') ? `1ª distribuição ${val(r, '1ª Distribuição')}` : ''
        ].filter(Boolean).map(esc).join(' · ');
        const cabecalhoGrupo = `
          <tr class="grp-row"><td colspan="${colsParte.length}">
            <div class="grp-head">
              <span class="proc-num" style="font-size: 12px;">${esc(numero)}</span>
              <span class="badge-court">${esc(grau)}${instancia && instancia !== grau ? ' · ' + esc(instancia) : ''}</span>
              <span class="grp-info">${info}</span>
              <span class="grp-acao">${acaoConsulta(val(r, 'Consulta'), numero)}</span>
            </div>
          </td></tr>`;
        const corpo = [...partes]
          .sort((a, b) => ordemPapel(val(a, 'Sujeito Processual')) - ordemPapel(val(b, 'Sujeito Processual')))
          .map(p => `<tr>${colsParte.map(c => celulaParte(c, val(p, c))).join('')}</tr>`).join('');
        return cabecalhoGrupo + corpo;
      }).join('');

      const nProcessos = new Set(grupos.map(g => val(g.r, 'Número do Processo'))).size;
      card.innerHTML = cabecalho + `
        <div class="proc-registros-resumo">${esc(String(linhas.length))} linha(s) em <strong>${grupos.length} autuação(ões)</strong>${nProcessos > 1 ? ` de ${nProcessos} processos` : ''} — cada autuação (1º grau, recurso no 2º grau, sistema anterior à migração) aparece com as suas partes.</div>
        <div style="overflow-x: auto;">
          <table class="data-table"><thead><tr>${colsParte.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${tb}</tbody></table>
        </div>
        ${data?.truncado ? `<div class="julia-dec-sub">Exibindo ${esc(String(linhas.length))} de ${esc(String(data.total))} registros — aumente o "limite" para ver mais.</div>` : ''}
        <div class="julia-dec-sub">Documento das partes mascarado, como na tela. Fonte: painel "Busca Processual Unificada" (Portal BI/TRF5). Em "Acompanhar", o assistente abre a consulta pública do sistema (pje1g, pje2g ou pjett) numa aba nova, preenche o número, dispara a pesquisa e abre o detalhe do processo.</div>
      `;

      card.querySelectorAll('[data-apoia-acompanhar]').forEach(btn => {
        btn.addEventListener('click', () => abrirAcompanhamentoPje(btn.dataset.url, btn.dataset.num));
      });
      container.appendChild(card);
    }

    buscaUnificadaToMarkdown(data) {
      const linhas = data?.linhas || [];
      const colunas = data?.colunas || [];
      let out = `## Busca Processual Unificada\n\n`;
      out += `- **Campo:** ${data?.campo || ''}\n- **Termo pesquisado:** ${data?.termo || ''}\n- **Registros:** ${data?.total ?? 0}\n\n`;
      if (!linhas.length) return out + `_Nenhum registro encontrado._\n`;
      out += `| ${colunas.join(' | ')} |\n| ${colunas.map(() => '---').join(' | ')} |\n`;
      linhas.forEach(r => {
        out += `| ${colunas.map((c, i) => String(r[i] ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
      });
      if (data?.truncado) out += `\n_Exibindo ${linhas.length} de ${data.total} registros._\n`;
      return out;
    }

    juliaToMarkdown(data) {
      const processos = data?.processos || [];
      return processos.map(p => {
        let out = `## Processo ${p.numeroProcesso}\n`;
        if (p.erro) return out + `\n_Erro na consulta: ${p.erro}_\n`;
        if (!p.documentos.length) return out + `\n_Nenhuma decisão indexada na Julia._\n`;
        p.documentos.forEach(d => {
          out += `\n### ${d.tipoLabel} — ${d.orgaoJulgador || ''} (${formatarDataIso(d.dataJulgamento)})\n`;
          out += `- **Classe:** ${d.classeJudicial || ''}\n`;
          if (d.relator) out += `- **Magistrado(a)/Relator(a):** ${d.relator}\n`;
          if (d.resultado) out += `- **Resultado (heurístico):** ${d.resultado}${d.votacao ? `, por ${d.votacao}` : ''}\n`;
          if (d.dispositivo) out += `\n> ${d.dispositivo.replace(/\n/g, '\n> ')}\n`;
        });
        return out;
      }).join('\n---\n\n');
    }

    // precedentFullText: o formato exato não está no código público do Apoia;
    // a descrição da tool garante número, classe, UF e texto por item. Aceita
    // variações de nome de campo e resposta em texto puro.
    normalizePrecedentFullText(data) {
      if (data == null) return [];
      if (typeof data === 'string') return [{ texto: data }];
      const lista = Array.isArray(data)
        ? data
        : (data.resultados || data.documentos || data.results || data.items || data.precedentes || [data]);
      const txt = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2));
      return lista.map(it => {
        if (typeof it === 'string') return { texto: it };
        const proc = typeof it.processo === 'object' && it.processo ? it.processo : {};
        return {
          id: it.id ?? it.idDocumento ?? '',
          numero: it.numeroProcesso || it.numero_processo || proc.numero || proc.numeroProcesso || (typeof it.processo === 'string' ? it.processo : '') || it.numero || '',
          classe: it.classe?.descricao || (typeof it.classe === 'string' ? it.classe : '') || it.siglaClasse || proc.classe || '',
          uf: it.uf || proc.uf || '',
          tipo: it.tipoDocumento || it.tipo || '',
          orgao: it.orgaoJulgador || it.orgao || '',
          relator: it.relator || '',
          data: it.dataJulgamento || it.dataPublicacao || '',
          texto: txt(it.texto ?? it.inteiroTeor ?? it.textoCompleto ?? it.conteudo ?? it.content ?? it.text ?? it.ementa),
          erro: it.erro || it.error || ''
        };
      });
    }

    renderPrecedentFullText(container, data) {
      const docs = this.normalizePrecedentFullText(data);
      const esc = (s) => this.escapeHtml(String(s ?? ''));
      if (docs.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 16px;">Nenhum documento retornado.</div>`;
        return;
      }
      docs.forEach(d => {
        const card = document.createElement('div');
        card.className = 'proc-card';
        const titulo = d.numero ? `Processo ${d.numero}` : `Documento ${d.id || ''}`;
        const meta = [d.orgao, d.relator, d.data].filter(Boolean).join(' · ');
        card.innerHTML = `
          <div class="proc-header">
            <div>
              <div class="proc-num">${esc(titulo)}</div>
              ${meta ? `<div style="font-size: 11px; color: var(--text-muted);">${esc(meta)}</div>` : ''}
            </div>
            <div class="juris-meta">
              ${d.classe ? `<span class="badge-type">${esc(d.classe)}</span>` : ''}
              ${d.uf ? `<span class="badge-court">${esc(d.uf)}</span>` : ''}
              ${d.tipo ? `<span class="badge-status">${esc(d.tipo)}</span>` : ''}
            </div>
          </div>
          ${d.erro
            ? `<div class="error-card"><div class="error-card-body">${esc(d.erro)}</div></div>`
            : `<div class="julia-disp" style="max-height: 260px;">${esc(d.texto.slice(0, 3000))}${d.texto.length > 3000 ? ' […]' : ''}</div>
               <div class="julia-actions" style="margin-top: 6px;">
                 <button class="doc-btn-view" data-acao="ler">${ICONS.file} Ler íntegra</button>
                 <button class="doc-btn-view" data-acao="copiar">${ICONS.copy} Copiar íntegra</button>
               </div>`}
        `;
        card.querySelector('[data-acao="ler"]')?.addEventListener('click', () => {
          this.openTextViewer(titulo, [d.classe, d.uf, d.tipo, meta].filter(Boolean).join(' · ') || 'Inteiro teor', d.texto);
        });
        card.querySelector('[data-acao="copiar"]')?.addEventListener('click', () => {
          GM_setClipboard(d.texto);
          this.showToast('Inteiro teor copiado para a área de transferência.');
        });
        container.appendChild(card);
      });
    }

    // Botão "Inteiro teor" nos resultados de Precedentes: busca e abre no visualizador.
    async openPrecedentFullText(id, titulo) {
      const body = this.shadow.getElementById('pieceViewerBody');
      this.openTextViewer(titulo || 'Inteiro teor', `ID: ${id}`, '');
      body.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--text-muted);"><div class="loader"></div> Carregando inteiro teor pelo Apoia MCP...</div>`;
      try {
        const res = await this.client.callTool('precedentFullText', { idArray: [String(id)] });
        const doc = this.normalizePrecedentFullText(res.data ?? res.text)[0];
        if (!doc || doc.erro || !doc.texto) throw { message: doc?.erro || 'Documento sem texto retornado.' };
        const sub = [doc.numero && `Processo ${doc.numero}`, doc.classe, doc.uf].filter(Boolean).join(' · ');
        this.openTextViewer(titulo || 'Inteiro teor', sub || `ID: ${id}`, doc.texto);
      } catch (err) {
        this.currentLoadedPieceText = '';
        const info = this.interpretServiceError(err.message || 'Falha ao obter o inteiro teor');
        body.innerHTML = `
          <div class="error-card">
            <div class="error-card-title">${ICONS.alert} ${this.escapeHtml(info.title)}</div>
            <div class="error-card-body">${this.escapeHtml(info.body)}</div>
          </div>
        `;
        this.appendRetryButton(body, () => this.openPrecedentFullText(id, titulo));
      }
    }

    // Visualizador de peças reaproveitado para textos já disponíveis localmente.
    openTextViewer(titulo, subtitulo, texto) {
      this.shadow.getElementById('pieceViewerTitle').textContent = titulo;
      this.shadow.getElementById('pieceViewerSub').textContent = subtitulo;
      this.shadow.getElementById('pieceViewerBody').textContent = texto || 'Sem texto.';
      this.shadow.getElementById('pieceViewerOverlay').style.display = 'flex';
      this.currentLoadedPieceText = texto || '';
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

    renderJurisprudenceCards(container, data, toolName) {
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
        const especie = item.especie || item.data?.tipo || item.title || item.tipoDocumento || '';
        const numero = item.numero || item.data?.nr || item.numeroProcesso || '';
        const situacao = item.situacao || item.data?.situacao || '';
        // Precedentes Jurisprudenciais trazem "ementa" (acórdãos/súmulas) e o trecho em "texto",
        // às vezes com marcação HTML de destaque: vira texto puro antes de escapar.
        const textoPuro = (s) => this.escapeHtml(String(s).replace(/<[^>]+>/g, ''));
        const tese = item.tese || item.teseSnippet || item.data?.tese || item.titulo || (item.ementa && textoPuro(item.ementa)) || (item.texto && textoPuro(item.texto)) || 'Sem texto de tese.';
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

        if (toolName === 'precedent' && item.id != null && this.tools.some(t => t.name === 'precedentFullText')) {
          const btn = document.createElement('button');
          btn.className = 'doc-btn-view';
          btn.style.alignSelf = 'flex-start';
          btn.innerHTML = `${ICONS.file} Inteiro teor`;
          const titulo = [especie, numero].filter(Boolean).join(' ') || 'Inteiro teor';
          btn.addEventListener('click', () => this.openPrecedentFullText(item.id, titulo));
          card.appendChild(btn);
        }

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
        const list = (Array.isArray(data) ? data : [data]).filter(p => p && typeof p === 'object');
        return list.map(p => this.resumirRegistroProcesso(p))
          .sort((a, b) => String(b.fim).localeCompare(String(a.fim)))
          .map(({ proc, grau, orgao, inicio, fim, situacao }) => {
          let out = `## Processo: ${formatarCnj(proc.numeroProcesso) || ''} — ${grau}\n`;
          out += `- **Tribunal:** ${proc.tribunal?.sigla || ''} (${proc.tribunal?.nome || ''})\n`;
          if (orgao) out += `- **Órgão julgador:** ${orgao}\n`;
          out += `- **Período:** ${mesAno(inicio)} a ${mesAno(fim)}${situacao ? ` (${situacao})` : ''}\n`;
          out += `- **Classe:** ${proc.classe?.descricao || ''}\n`;
          if (proc.assuntos?.[0]) out += `- **Assunto:** ${proc.assuntos[0].descricao}\n`;
          if (proc.informacoesGerais?.valorAcao) out += `- **Valor da Causa:** R$ ${proc.informacoesGerais.valorAcao}\n`;
          out += `\n### Partes:\n`;
          if (proc.partes?.poloAtivo) proc.partes.poloAtivo.forEach(p => out += `- **${p.tipo || 'AUTOR'}:** ${p.nome}\n`);
          if (proc.partes?.poloPassivo) proc.partes.poloPassivo.forEach(p => out += `- **${p.tipo || 'RÉU'}:** ${p.nome}\n`);
          return out;
        }).join('\n---\n\n');
      }

      if (toolName === 'juliaDecisions') {
        return this.juliaToMarkdown(data);
      }

      if (toolName === 'buscaProcessualUnificada') {
        return this.buscaUnificadaToMarkdown(data);
      }

      if (toolName === 'precedentFullText') {
        return this.normalizePrecedentFullText(data).map(d => {
          let out = `## ${d.numero ? 'Processo ' + d.numero : 'Documento ' + (d.id || '')}\n`;
          const meta = [d.classe, d.uf, d.tipo, d.orgao, d.data].filter(Boolean).join(' · ');
          if (meta) out += `_${meta}_\n`;
          return out + (d.erro ? `\n_Erro: ${d.erro}_\n` : `\n${d.texto}\n`);
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
        const fonte = fonteDe({ name: item.toolName });
        const nome = (TOOL_META[item.toolName] || {}).displayName || item.toolName;
        card.style.cssText = 'background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px 10px; cursor: pointer;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 11px; margin-bottom: 2px;">
            <span style="display: flex; align-items: center; gap: 6px;"><span class="src-chip ${fonte.classe}">${fonte.rotulo}</span><strong style="color: var(--text-main);">${this.escapeHtml(nome)}</strong></span>
            <span style="color: var(--text-dim);">${item.date}</span>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.escapeHtml(JSON.stringify(item.args))}
          </div>
        `;

        card.addEventListener('click', () => {
          const tool = this.tools.find(t => t.name === item.toolName);
          if (tool) {
            this.selectTool(tool);
            this.populateFormValues(item.args);
          } else {
            this.showToast('Ferramenta indisponível no momento (token do Apoia expirado?).');
          }
        });

        list.appendChild(card);
      });
    }

    // Alterna o modo expandido dos resultados: oculta o formulário e a grade
    // de ferramentas para que os documentos ocupem toda a altura do painel.
    toggleMaximizeResults(force) {
      const drawer = this.shadow.getElementById('drawer');
      const btn = this.shadow.getElementById('btnMaximizeResults');
      const shouldMaximize = typeof force === 'boolean'
        ? force
        : !drawer.classList.contains('results-maximized');

      drawer.classList.toggle('results-maximized', shouldMaximize);
      if (btn) {
        btn.classList.toggle('active', shouldMaximize);
        btn.innerHTML = shouldMaximize ? ICONS.minimize : ICONS.maximize;
        btn.title = shouldMaximize
          ? 'Recolher resultados'
          : 'Expandir resultados para ocupar todo o painel';
      }

      this.shadow.querySelectorAll('#resultsContent .has-movs-toggle').forEach(card => {
        card.dispatchEvent(new CustomEvent('apoia-maximize', { detail: shouldMaximize }));
      });
    }

    escapeHtml(str) {
      if (typeof str !== 'string') return str;
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    registerEvents() {
      this.shadow.getElementById('btnClose').addEventListener('click', () => this.toggleDrawer(false));
      this.shadow.getElementById('drawerBackdrop').addEventListener('click', () => this.toggleDrawer(false));
      this.shadow.getElementById('btnBackToTools').addEventListener('click', () => this.backToToolsList());

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
          const drawer = this.shadow.getElementById('drawer');
          if (overlay && overlay.style.display === 'flex') {
            this.closePieceViewer();
          } else if (this.isOpen && (this.view === 'settings' || this.view === 'history')) {
            this.closePanel();
          } else if (this.isOpen && this.view === 'runner') {
            this.backToToolsList();
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
          this.backToToolsList();
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
      this.shadow.getElementById('btnMaximizeResults').addEventListener('click', () => this.toggleMaximizeResults());

      // Ícones do cabeçalho alternam: um segundo clique volta para onde estava.
      this.shadow.getElementById('btnSettings').addEventListener('click', () => {
        if (this.view === 'settings') this.closePanel();
        else this.openSettingsPanel({ alerta: this.apoiaStatus === 'expired' ? 'Token expirado ou inválido. Cole um novo token e salve.' : '' });
      });

      this.shadow.querySelectorAll('[data-panel-back]').forEach(btn => {
        btn.addEventListener('click', () => this.closePanel());
      });

      // Salvar testa o token na hora: se o Apoia aceitar, volta para onde o
      // usuário estava (ex.: a ferramenta que falhou com 401); senão, fica aqui.
      this.shadow.getElementById('btnSaveConfig').addEventListener('click', async () => {
        const tokenVal = this.shadow.getElementById('cfgTokenInput').value.trim();
        const urlVal = this.shadow.getElementById('cfgUrlInput').value.trim();
        const themeVal = this.shadow.getElementById('cfgThemeSelect').value;
        this.client.setCredentials(urlVal, tokenVal);
        this.applyTheme(themeVal, false);
        this.setSettingsAlert('');
        this.showToast('Configurações salvas. Verificando o token...');
        const ok = await this.loadTools({ abrirConfigSeExpirado: false });
        if (ok) {
          this.showToast('Token aceito — conectado ao Apoia MCP.');
          if (this.view === 'settings') this.closePanel();
        } else {
          this.setSettingsAlert(this.apoiaStatus === 'expired'
            ? 'O Apoia recusou este token (expirado ou inválido). Gere um novo no portal e cole aqui.'
            : `Não foi possível conectar ao Apoia MCP: ${this.apoiaMsg}`);
        }
      });

      this.shadow.getElementById('btnTestConfig').addEventListener('click', async () => {
        this.showToast('Testando conexão com o Apoia MCP...');
        const ok = await this.loadTools({ abrirConfigSeExpirado: false });
        this.setSettingsAlert(ok ? '' : (this.apoiaStatus === 'expired' ? 'Token expirado ou inválido.' : `Sem conexão: ${this.apoiaMsg}`));
        if (ok) this.showToast('Conexão OK — token aceito pelo Apoia MCP.');
      });

      this.shadow.getElementById('btnHistory').addEventListener('click', () => {
        if (this.view === 'history') {
          this.closePanel();
        } else {
          this.setView('history');
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

  // Se esta aba foi aberta pelo botão "Acompanhar" da busca unificada, preenche
  // a consulta pública do PJe, dispara a pesquisa e abre o detalhe do processo.
  iniciarAtalhoConsulta();

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Abrir Assistente Apoia MCP (Alt + M)', () => {
      mcpUI.toggleDrawer(true);
    });
  }
})();
