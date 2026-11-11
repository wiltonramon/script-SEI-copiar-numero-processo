// ==UserScript==
// @name         SEI TRE-CE | Copiar número do processo
// @namespace    https://sei.tre-ce.jus.br/
// @version      1.12.7
// @author       Ramon Machado
// @description  Copia o número do processo exibido ao lado do ícone no SEI.
// @match        https://sei.tre-ce.jus.br/sei/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/597832/SEI%20TRE-CE%20%7C%20Copiar%20n%C3%BAmero%20do%20processo.user.js
// @updateURL    https://update.greasyfork.org/scripts/597832/SEI%20TRE-CE%20%7C%20Copiar%20n%C3%BAmero%20do%20processo.meta.js
// ==/UserScript==

(function () {
  'use strict';

  // A árvore tem seu próprio documento, inclusive quando aberta em iframe.
  // As demais telas não precisam de botão, temporizadores ou observadores.
  const acao = new URL(window.location.href).searchParams.get('acao');
  if (acao !== 'procedimento_visualizar') return;

  const BUTTON_ID = 'tm-copiar-numero-processo-sei';
  const NUMERO_PROCESSO_RE = /^\d{4}\.\d\.\d{9}-\d$/;
  const TAMANHO_ICONE = 24;
  const COR_ICONE = '#078bb9';
  const COR_COPIADO = '#198754';
  const TEMPO_CONFIRMACAO = 2000;

  function localizarLink(menu) {
    return Array.from(menu.querySelectorAll(':scope > a')).find(link => {
      const span = link.querySelector(':scope > span');
      return span && NUMERO_PROCESSO_RE.test(span.textContent.trim());
    });
  }

  function copiarPorSelecao(doc, numero) {
    const ativo = doc.activeElement;
    const campo = doc.createElement('textarea');
    campo.value = numero;
    campo.setAttribute('readonly', '');
    campo.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;'
      + 'opacity:0;pointer-events:none;';
    doc.body.appendChild(campo);
    try {
      campo.focus({ preventScroll: true });
      campo.select();
      campo.setSelectionRange(0, numero.length);
      return doc.execCommand('copy');
    } finally {
      campo.remove();
      if (ativo?.isConnected) ativo.focus({ preventScroll: true });
    }
  }

  async function copiar(numero) {
    // As tentativas por seleção são síncronas, dentro do clique do usuário.
    try {
      if (copiarPorSelecao(document, numero)) return;
    } catch (erro) {
      console.warn('[SEI Copiar Processo] Cópia na árvore recusada:', erro);
    }
    try {
      const principal = window.top.document;
      if (principal !== document && copiarPorSelecao(principal, numero)) return;
    } catch (erro) {
      console.warn('[SEI Copiar Processo] Cópia na página principal recusada:', erro);
    }

    // Último recurso: API assíncrona. Tenta a do top e, se faltar ou for
    // rejeitada, a do próprio iframe.
    const areas = [];
    try {
      if (window.top.navigator.clipboard) areas.push(window.top.navigator.clipboard);
    } catch {
      // Acesso ao top bloqueado: segue só com a área local.
    }
    if (navigator.clipboard && !areas.includes(navigator.clipboard)) {
      areas.push(navigator.clipboard);
    }

    let ultimoErro = null;
    for (const area of areas) {
      if (!area.writeText) continue;
      try {
        await area.writeText(numero);
        return;
      } catch (erro) {
        ultimoErro = erro;
        console.warn('[SEI Copiar Processo] Clipboard API recusada:', erro);
      }
    }
    throw ultimoErro || new Error('O navegador bloqueou a área de transferência.');
  }

  function avisar(botao, texto, falha = false) {
    const id = 'tm-copiar-processo-aviso';
    document.getElementById(id)?.remove();
    const aviso = document.createElement('div');
    aviso.id = id;
    aviso.setAttribute('role', falha ? 'alert' : 'status');
    aviso.textContent = texto;
    const cor = falha ? '#b91c1c' : '#166534';
    aviso.style.cssText = 'position:fixed;z-index:99999;box-sizing:border-box;'
      + 'max-width:min(270px, calc(100% - 16px));padding:6px 9px;border-radius:6px;'
      + 'pointer-events:none;overflow-wrap:anywhere;text-align:center;'
      + 'box-shadow:0 2px 8px rgba(0,0,0,.2);'
      + 'background:' + cor + ';color:#fff;font:600 13px/1.3 Arial,sans-serif;';
    document.body.appendChild(aviso);

    function posicionar() {
      const area = botao.getBoundingClientRect();
      const largura = aviso.offsetWidth;
      const limite = document.documentElement.clientWidth - largura - 8;
      const centro = area.left + (area.width - largura) / 2;
      aviso.style.left = Math.max(8, Math.min(centro, limite)) + 'px';
      aviso.style.top = (area.bottom + 6) + 'px';
    }

    const eventos = new AbortController();
    posicionar();
    window.addEventListener('resize', posicionar, { signal: eventos.signal });
    window.addEventListener('scroll', posicionar, { capture: true, signal: eventos.signal });
    return () => {
      eventos.abort();
      aviso.remove();
    };
  }

  // Mantém o desenho, a cor e o hover nativo da versão 1.11.1.
  function icone(cor, copiado) {
    const tracos = copiado
      ? '<path d="M5 13l4 4L19 7"/>'
      : '<rect x="5" y="4" width="14" height="18" rx="2"/>'
        + '<path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + TAMANHO_ICONE + '" height="' + TAMANHO_ICONE + '" '
      + 'viewBox="0 0 24 24" fill="none" stroke="' + cor + '" stroke-width="2" '
      + 'stroke-linecap="round" stroke-linejoin="round">' + tracos + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function criarBotao() {
    const botao = document.createElement('a');
    botao.id = BUTTON_ID;
    botao.href = '#';
    botao.className = 'infraArvoreNoAcao';
    botao.setAttribute('role', 'button');
    botao.setAttribute('aria-label', 'Copiar número do processo');
    const img = document.createElement('img');
    img.src = icone(COR_ICONE, false);
    img.title = 'Copiar número do processo';
    img.alt = '';
    img.width = TAMANHO_ICONE;
    img.height = TAMANHO_ICONE;
    img.style.setProperty('width', TAMANHO_ICONE + 'px', 'important');
    img.style.setProperty('height', TAMANHO_ICONE + 'px', 'important');
    img.style.setProperty('max-width', 'none', 'important');
    img.style.setProperty('max-height', 'none', 'important');
    botao.appendChild(img);
    let ocupado = false;
    let restaurarIcone;
    let removerAviso;

    function limparConfirmacao() {
      removerAviso?.();
      removerAviso = null;
      img.src = icone(COR_ICONE, false);
      img.title = 'Copiar número do processo';
      botao.setAttribute('aria-label', 'Copiar número do processo');
    }

    botao.addEventListener('keydown', evento => {
      if (evento.key === ' ') evento.preventDefault();
    });
    botao.addEventListener('keyup', evento => {
      if (evento.key === ' ') {
        evento.preventDefault();
        botao.click();
      }
    });
    botao.addEventListener('click', async evento => {
      evento.preventDefault();
      if (ocupado) return;
      ocupado = true;
      clearTimeout(restaurarIcone);
      limparConfirmacao();
      try {
        // Lê o número visível no mesmo menu, sem depender do título da página.
        const link = localizarLink(botao.parentElement);
        const numero = link?.querySelector(':scope > span')?.textContent.trim();
        if (!numero || !NUMERO_PROCESSO_RE.test(numero)) {
          throw new Error('O número do processo não está disponível no menu.');
        }
        await copiar(numero);
        img.src = icone(COR_COPIADO, true);
        img.title = 'Número do processo copiado!';
        botao.setAttribute('aria-label', 'Número do processo copiado!');
        removerAviso = avisar(botao, 'Copiado!');
      } catch (erro) {
        console.error('[SEI Copiar Processo]', erro);
        removerAviso = avisar(botao, 'Não foi possível copiar: ' + erro.message, true);
      } finally {
        ocupado = false;
        restaurarIcone = setTimeout(limparConfirmacao, TEMPO_CONFIRMACAO);
      }
    });
    return botao;
  }

  function instalarBotao() {
    const menu = document.querySelector('#header #topmenu');
    if (!menu) return;
    const link = localizarLink(menu);
    const existente = menu.querySelector('#' + BUTTON_ID);
    if (!link) {
      existente?.remove();
      return;
    }
    const botao = existente || criarBotao();
    if (link.nextElementSibling !== botao) link.insertAdjacentElement('afterend', botao);
  }

  let observadorInterno = null;
  let observadorExterno = null;
  let cabecalhoAtual = null;
  let verificacaoAgendada = false;

  function vigiar() {
    observadorInterno?.disconnect();
    observadorExterno?.disconnect();
    observadorInterno = null;
    cabecalhoAtual = document.getElementById('header');
    if (cabecalhoAtual) {
      observadorInterno = new MutationObserver(agendarVerificacao);
      observadorInterno.observe(cabecalhoAtual, {
        childList: true, subtree: true, characterData: true
      });
      observadorExterno = new MutationObserver(agendarVerificacao);
      observadorExterno.observe(cabecalhoAtual.parentNode || document.documentElement, {
        childList: true
      });
    } else {
      observadorExterno = new MutationObserver(agendarVerificacao);
      observadorExterno.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function agendarVerificacao() {
    if (verificacaoAgendada) return;
    verificacaoAgendada = true;
    requestAnimationFrame(() => {
      verificacaoAgendada = false;
      instalarBotao();
      if (document.getElementById('header') !== cabecalhoAtual) vigiar();
    });
  }

  instalarBotao();
  vigiar();
})();
