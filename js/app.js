/*
 * Relatório de despesas — página única, só visualização.
 * Os dados vêm de dados/transacoes.js (window.FINANCAS), processados no chat.
 */
(function () {
  'use strict';

  // ---------- regras ----------
  const RECEITAS = ['Salário e renda', 'Recebimentos'];
  const NEUTRAS = ['Investimentos', 'Transferência entre contas'];   // não contam como gasto nem renda
  const FIXAS = ['Moradia', 'Contas da casa', 'Assinaturas', 'Educação', 'Academia'];
  const OUTROS = 'Outros';                                            // gasto sem destino conhecido

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const SEMANA_LONGA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const $ = id => document.getElementById(id);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const moeda = v => brl.format(v);
  const inteiro = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const pct = v => Math.round(v * 100) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dm = iso => iso.slice(8) + '/' + iso.slice(5, 7);

  // ---------- dados ----------
  const F = window.FINANCAS || { transacoes: [], extratos: [] };
  const TODAS = F.transacoes.map(t => {
    const natureza = NEUTRAS.includes(t.categoria) ? 'neutra' : RECEITAS.includes(t.categoria) ? 'receita' : 'despesa';
    // quanto soma no total (troco/reembolso numa categoria de gasto abate o gasto)
    const contrib = natureza === 'despesa' ? -t.valor : natureza === 'receita' ? t.valor : 0;
    return { ...t, natureza, contrib, mes: t.data.slice(0, 7) };
  }).sort((a, b) => a.data.localeCompare(b.data));
  const LISTA_MESES = [...new Set(TODAS.map(t => t.mes))].sort();

  const estado = { mes: LISTA_MESES[LISTA_MESES.length - 1] || '', categoria: '', dia: 0 };

  const soma = l => l.reduce((s, t) => s + t.contrib, 0);
  function agrupar(lista, chave) {
    const m = new Map();
    for (const t of lista) {
      const k = chave(t);
      const g = m.get(k) || { chave: k, total: 0, itens: [] };
      g.total += t.contrib; g.itens.push(t); m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }
  const qtdGastos = l => l.filter(t => t.valor < 0).length;

  // ---------- dica (tooltip) ----------
  const dica = $('dica');
  function mostrarDica(e, html) {
    dica.innerHTML = html; dica.hidden = false;
    const x = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8);
    const y = e.clientY + 18 + dica.offsetHeight > innerHeight ? e.clientY - dica.offsetHeight - 12 : e.clientY + 18;
    dica.style.left = x + 'px'; dica.style.top = y + 'px';
  }
  const esconderDica = () => { dica.hidden = true; };
  function comDica(el, html) {
    el.addEventListener('mousemove', e => mostrarDica(e, html));
    el.addEventListener('mouseleave', esconderDica);
  }

  // ---------- render ----------
  function render() {
    const doMes = TODAS.filter(t => t.mes === estado.mes);
    const gastos = doMes.filter(t => t.natureza === 'despesa');
    const categorias = agrupar(gastos, t => t.categoria).filter(g => g.total > 0.005);
    const total = soma(gastos);

    capa(doMes, gastos, categorias, total);
    barras(categorias, total);
    fixoVariavel(gastos, total);
    semDestino(gastos, total);
    ranking(gastos);
    diaADia(gastos);
    lancamentos(gastos);
  }

  function periodoDoMes() {
    const ext = (F.extratos || []).filter(e => e.de.slice(0, 7) <= estado.mes && e.ate.slice(0, 7) >= estado.mes);
    const de = ext.map(e => e.de < estado.mes + '-01' ? estado.mes + '-01' : e.de).sort()[0];
    const ate = ext.map(e => e.ate.slice(0, 7) > estado.mes ? estado.mes + '-31' : e.ate).sort().slice(-1)[0];
    return { de, ate };
  }

  function capa(doMes, gastos, categorias, total) {
    const [a, n] = estado.mes.split('-').map(Number);
    $('mesNome').textContent = MESES[n - 1] || '—';
    $('anoNome').textContent = a || '';
    $('capaTotal').textContent = moeda(total);
    const { de, ate } = periodoDoMes();
    const ultimo = new Date(a, n, 0).getDate();
    const aberto = ate && +ate.slice(8) < ultimo;
    $('capaSub').textContent = de
      ? `gastos de ${dm(de)} a ${dm(ate)}${aberto ? ' · mês ainda em andamento' : ''}`
      : 'sem dados neste mês';

    const receitas = soma(doMes.filter(t => t.natureza === 'receita'));
    const maior = gastos.filter(t => t.valor < 0).sort((x, y) => x.valor - y.valor)[0];
    const itens = [
      [qtdGastos(gastos), '', 'gastos no mês'],
      [categorias.length, '', 'categorias'],
      [receitas ? Math.round(total / receitas * 100) : '—', receitas ? '%' : '', 'do que entrou'],
      [maior ? inteiro(-maior.valor).replace('R$ ', '') : '—', maior ? 'R$' : '', maior ? `maior gasto · ${maior.obs || maior.nome}` : 'maior gasto'],
    ];
    $('numeros').innerHTML = itens.map(([v, u, r]) =>
      `<div><strong>${u === 'R$' ? '<small class="antes">R$</small>' : ''}${esc(v)}${u && u !== 'R$' ? `<small>${u}</small>` : ''}</strong><span>${esc(r)}</span></div>`).join('');

    $('atualizado').textContent = F.atualizadoEm ? `atualizado em ${F.atualizadoEm.split('-').reverse().join('/')}` : '';
  }

  // 01 — barras por categoria
  function barras(categorias, total) {
    const max = categorias.length ? categorias[0].total : 1;
    const caixa = $('barras');
    caixa.classList.toggle('filtrando', !!estado.categoria);
    caixa.innerHTML = categorias.map(g => `
      <div class="barra${g.chave === OUTROS ? ' outros' : ''}${g.chave === estado.categoria ? ' ativa' : ''}" data-cat="${esc(g.chave)}" role="button" tabindex="0">
        <div><span class="b-valor">${inteiro(g.total)}</span><span class="b-pct">${pct(g.total / total)}</span></div>
        <div class="b-trilho"><div class="b-cheio" style="--p:${(g.total / max).toFixed(4)}"></div></div>
        <div class="b-nome">${esc(g.chave)}</div>
      </div>`).join('') || '<p class="vazio-msg">Nenhum gasto neste mês.</p>';
    caixa.querySelectorAll('.barra').forEach(el => {
      const g = categorias.find(c => c.chave === el.dataset.cat);
      const q = qtdGastos(g.itens);
      comDica(el, `<b>${esc(g.chave)}</b>${moeda(g.total)} · ${pct(g.total / total)} do total<br>${q} ${q === 1 ? 'gasto' : 'gastos'}`);
      const escolher = () => {
        estado.categoria = estado.categoria === g.chave ? '' : g.chave;
        render();
        if (estado.categoria) $('lancamentos').closest('.secao').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      el.addEventListener('click', escolher);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(); } });
    });
  }

  // 02 — meia-lua fixo x variável
  function fixoVariavel(gastos, total) {
    const fixo = soma(gastos.filter(t => FIXAS.includes(t.categoria)));
    const variavel = total - fixo;
    const f = total ? fixo / total : 0;
    const cx = 120, cy = 120, R = 112, r = 78;
    const ponto = (raio, ang) => `${(cx + raio * Math.cos(ang)).toFixed(2)},${(cy + raio * Math.sin(ang)).toFixed(2)}`;
    const setor = (a0, a1) => `M${ponto(R, a0)} A${R},${R} 0 0 1 ${ponto(R, a1)} L${ponto(r, a1)} A${r},${r} 0 0 0 ${ponto(r, a0)} Z`;
    const meio = Math.PI + f * Math.PI;
    $('meiaLua').innerHTML =
      (f > 0 ? `<path d="${setor(Math.PI, meio)}" fill="#111"/>` : '') +
      (f < 1 ? `<path d="${setor(meio, 2 * Math.PI)}" fill="#f4b400"/>` : '') +
      (f > 0 && f < 1 ? `<line x1="${ponto(r - 2, meio).split(',')[0]}" y1="${ponto(r - 2, meio).split(',')[1]}" x2="${ponto(R + 2, meio).split(',')[0]}" y2="${ponto(R + 2, meio).split(',')[1]}" stroke="#fff" stroke-width="3"/>` : '');
    $('pctFixo').textContent = total ? pct(f) : '—';
    const fixasPresentes = [...new Set(gastos.filter(t => FIXAS.includes(t.categoria)).map(t => t.categoria))];
    $('fixoLegenda').innerHTML = `
      <div><b>${moeda(fixo)}</b><span>Fixo${fixasPresentes.length ? ': ' + esc(fixasPresentes.join(', ').toLowerCase()) : ''}</span></div>
      <div class="var"><b>${moeda(variavel)}</b><span>Variável: o resto (mercado, comida, lazer, transporte…)</span></div>`;
  }

  // 03 — sem destino (Outros)
  function semDestino(gastos, total) {
    const itens = gastos.filter(t => t.categoria === OUTROS).sort((a, b) => a.data.localeCompare(b.data));
    const v = soma(itens);
    $('outrosValor').textContent = moeda(v);
    $('outrosPct').textContent = itens.length
      ? `${pct(v / total)} dos gastos · ${qtdGastos(itens)} ${qtdGastos(itens) === 1 ? 'gasto' : 'gastos'} sem destino definido`
      : 'Tudo tem destino conhecido neste mês.';
    $('outrosLista').innerHTML = itens.map(t => `
      <li>
        <span class="o-nome">${dm(t.data)} · ${esc(t.nome)}</span>
        <span class="o-valor ${t.valor > 0 ? 'o-volta' : ''}">${t.valor > 0 ? '− ' + moeda(t.valor) : moeda(-t.valor)}</span>
        ${t.obs || t.nota ? `<span class="o-obs">${esc(t.obs || '')}${t.obs && t.nota ? ' · ' : ''}${esc(t.nota || '')}</span>` : ''}
      </li>`).join('');
  }

  // 04 — ranking por estabelecimento/pessoa
  function ranking(gastos) {
    const lista = estado.categoria ? gastos.filter(t => t.categoria === estado.categoria) : gastos;
    $('subOnde').textContent = estado.categoria ? `Só ${estado.categoria}` : 'Por estabelecimento ou pessoa';
    const grupos = agrupar(lista, t => t.nome).filter(g => g.total > 0.005).slice(0, 10);
    $('ranking').innerHTML = grupos.map(g => {
      const obs = [...new Set(g.itens.map(t => t.obs).filter(Boolean))].join(' · ');
      return `<li>
        <span class="r-nome" title="${esc(g.chave)}">${esc(g.chave)}</span>
        <span class="r-valor">${moeda(g.total)}</span>
        <span class="r-meta"><span class="chip">${esc(g.itens[0].categoria)}</span>${qtdGastos(g.itens)}×${obs ? ' · ' + esc(obs) : ''}</span>
      </li>`;
    }).join('') || '<li class="vazio-msg">Nenhum gasto.</li>';
  }

  // 05 — dia a dia
  function diaADia(gastos) {
    const [a, n] = estado.mes.split('-').map(Number);
    const ultimo = new Date(a, n, 0).getDate();
    const { ate } = periodoDoMes();
    const ultimoComDado = ate ? +ate.slice(8) : ultimo;
    const porDia = Array.from({ length: ultimo }, (_, i) => gastos.filter(t => +t.data.slice(8) === i + 1));
    const valores = porDia.map(soma);
    const max = Math.max(1, ...valores);
    const caixa = $('dias');
    caixa.innerHTML = valores.map((v, i) => {
      const d = i + 1, sem = new Date(a, n - 1, d).getDay();
      const cls = ['dia', v > 0.005 ? 'com' : 'vazio', d > ultimoComDado ? 'futuro' : '', sem % 6 === 0 ? 'fds' : '', estado.dia === d ? 'sel' : ''].join(' ');
      const rot = v > 0.005 ? (v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : Math.round(v)) : '';
      return `<div class="${cls}" data-dia="${d}"><span class="d-valor">${rot}</span><div class="d-trilho"><div class="d-cheio" style="--p:${Math.max(0, v / max).toFixed(4)}"></div></div><span class="d-num">${d}</span></div>`;
    }).join('');
    const detalhe = d => {
      const itens = porDia[d - 1];
      const sem = SEMANA_LONGA[new Date(a, n - 1, d).getDay()];
      if (d > ultimoComDado) return `<b>${String(d).padStart(2, '0')}/${String(n).padStart(2, '0')}</b> · ${sem} · ainda não está no extrato`;
      if (!itens.length) return `<b>${String(d).padStart(2, '0')}/${String(n).padStart(2, '0')}</b> · ${sem} · nenhum gasto`;
      return `<b>${String(d).padStart(2, '0')}/${String(n).padStart(2, '0')} · ${sem} · ${moeda(soma(itens))}</b> — ` +
        itens.map(t => `${esc(t.obs || t.nome)} (${t.valor > 0 ? '−' : ''}${moeda(Math.abs(t.valor))})`).join(', ');
    };
    caixa.querySelectorAll('.dia').forEach(el => {
      const d = +el.dataset.dia;
      comDica(el, detalhe(d).replace(/ — /, '<br>'));
      el.addEventListener('click', () => { estado.dia = estado.dia === d ? 0 : d; diaADia(gastos); });
    });
    $('diaDetalhe').innerHTML = estado.dia ? detalhe(estado.dia) : `Maior dia: <b>${dm(estado.mes + '-' + String(valores.indexOf(Math.max(...valores)) + 1).padStart(2, '0'))} · ${moeda(Math.max(...valores))}</b>`;
  }

  // 06 — lançamentos agrupados por dia
  function lancamentos(gastos) {
    const lista = estado.categoria ? gastos.filter(t => t.categoria === estado.categoria) : gastos;
    const filtro = $('filtroAtivo');
    filtro.hidden = !estado.categoria;
    filtro.innerHTML = estado.categoria ? `Mostrando só <span class="chip">${esc(estado.categoria)}</span> ${moeda(soma(lista))} <button type="button" id="limpar">ver tudo ✕</button>` : '';
    if (estado.categoria) $('limpar').addEventListener('click', () => { estado.categoria = ''; render(); });
    $('subLanc').textContent = `${qtdGastos(lista)} gastos · ${moeda(soma(lista))}${lista.some(t => t.valor > 0) ? ' (trocos/reembolsos já descontados)' : ''}`;

    const dias = [...new Set(lista.map(t => t.data))].sort().reverse();
    $('lancamentos').innerHTML = dias.map(d => {
      const itens = lista.filter(t => t.data === d).sort((x, y) => x.valor - y.valor);
      const sem = SEMANA[new Date(d + 'T12:00').getDay()];
      return `<div class="dia-grupo">
        <div class="g-data">${dm(d)}<small>${sem} · ${moeda(soma(itens))}</small></div>
        <div>${itens.map(t => `
          <div class="lanc">
            <span class="l-nome">${esc(t.nome)}</span>
            <span class="l-valor ${t.valor > 0 ? 'volta' : ''}">${t.valor > 0 ? '+ ' + moeda(t.valor) : moeda(-t.valor)}</span>
            <span class="l-meta"><span class="chip">${esc(t.categoria)}</span>${esc(t.tipo)}${t.valor > 0 ? ' · voltou, abate do gasto' : ''}</span>
            ${t.obs ? `<span class="l-obs">“${esc(t.obs)}”</span>` : ''}
            ${t.nota ? `<span class="l-nota">↳ ${esc(t.nota)}</span>` : ''}
          </div>`).join('')}
        </div>
      </div>`;
    }).join('') || '<p class="vazio-msg">Nenhum lançamento.</p>';
  }

  // ---------- início ----------
  if (LISTA_MESES.length > 1) {
    $('seletorMes').hidden = false;
    $('selMes').innerHTML = LISTA_MESES.slice().reverse().map(m => `<option value="${m}">${MESES[+m.slice(5) - 1]} de ${m.slice(0, 4)}</option>`).join('');
    $('selMes').value = estado.mes;
    $('selMes').addEventListener('change', e => { estado.mes = e.target.value; estado.categoria = ''; estado.dia = 0; render(); });
  }
  addEventListener('scroll', esconderDica, { passive: true });
  render();
})();
