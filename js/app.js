/*
 * Meus Gastos — página única, só visualização, com foco nas despesas.
 * Os dados vêm de dados/transacoes.js (window.FINANCAS), processados no chat.
 */
(function () {
  'use strict';

  // ---------- regras ----------
  const RECEITAS = ['Salário e renda', 'Recebimentos'];
  const NEUTRAS = ['Investimentos', 'Transferência entre contas'];
  const FIXAS = ['Moradia', 'Contas da casa', 'Assinaturas', 'Educação', 'Academia'];
  const OUTROS = 'Outros';

  // A cor pertence à categoria e não muda quando o ranking muda.
  // Categoria nova ganha uma cor aqui quando entrar nos dados.
  const CORES = {
    'Moradia': '#2a78d6',
    'Mercado': '#eb6834',
    'Contas da casa': '#1baf7a',
    'Fatura do cartão': '#eda100',
    [OUTROS]: '#9a9c95',
    'Alimentação': '#e34948',
    'Lazer': '#e87ba4',
    'Transporte': '#6250d6',
    'Compras': '#008300',
    'Pets': '#8a5a2b',
    'Bar e cigarro': '#1f3a5f',
    'Saúde': '#4fc1e0',
    'Assinaturas': '#a83c8c',
    'Impostos e tarifas': '#6b7a2a',
  };
  const corDe = c => CORES[c] || '#c9cbc4';

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const $ = id => document.getElementById(id);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const moeda = v => brl.format(v);
  const pct = (v, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dm = iso => iso.slice(8) + '/' + iso.slice(5, 7);
  const nomeMes = m => MESES[+m.slice(5) - 1];
  const capital = s => s[0].toUpperCase() + s.slice(1);
  const diaSemana = iso => SEMANA[new Date(iso + 'T12:00').getDay()];

  // ---------- dados ----------
  const F = window.FINANCAS || { transacoes: [], extratos: [] };
  // Só despesas: valor que volta numa categoria de gasto (troco, reembolso) abate o gasto.
  const GASTOS = F.transacoes
    .filter(t => !NEUTRAS.includes(t.categoria) && !RECEITAS.includes(t.categoria))
    .map(t => ({ ...t, gasto: -t.valor, mes: t.data.slice(0, 7) }));
  const LISTA_MESES = [...new Set(GASTOS.map(t => t.mes))].sort();

  const estado = { mes: LISTA_MESES[LISTA_MESES.length - 1] || '', categoria: '', dia: '' };

  const soma = l => l.reduce((s, t) => s + t.gasto, 0);
  const qtd = l => l.filter(t => t.valor < 0).length;
  const gastosTxt = n => `${n} ${n === 1 ? 'gasto' : 'gastos'}`;

  function porCategoria(lista) {
    const m = new Map();
    for (const t of lista) {
      if (!m.has(t.categoria)) m.set(t.categoria, []);
      m.get(t.categoria).push(t);
    }
    return [...m].map(([nome, itens]) => ({ nome, itens, total: soma(itens) }))
      .filter(g => g.total > 0.005)
      .sort((a, b) => b.total - a.total);
  }

  // Período coberto pelos extratos dentro do mês escolhido.
  function cobertura() {
    const [a, n] = estado.mes.split('-').map(Number);
    const ultimoDia = new Date(a, n, 0).getDate();
    const ext = (F.extratos || []).filter(e => e.de.slice(0, 7) <= estado.mes && e.ate.slice(0, 7) >= estado.mes);
    const de = ext.map(e => (e.de.slice(0, 7) < estado.mes ? estado.mes + '-01' : e.de)).sort()[0];
    const ate = ext.map(e => (e.ate.slice(0, 7) > estado.mes ? `${estado.mes}-${ultimoDia}` : e.ate)).sort().slice(-1)[0];
    const dias = de && ate ? +ate.slice(8) - +de.slice(8) + 1 : 0;
    return { de, ate, dias, ultimoDia, completo: de && ate && de.endsWith('-01') && +ate.slice(8) === ultimoDia };
  }

  // ---------- dica ao passar o mouse ----------
  const dica = $('dica');
  function comDica(el, html) {
    el.addEventListener('mouseenter', () => { dica.innerHTML = html; dica.hidden = false; });
    el.addEventListener('mousemove', e => {
      dica.style.left = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8) + 'px';
      dica.style.top = (e.clientY + 18 + dica.offsetHeight > innerHeight ? e.clientY - dica.offsetHeight - 10 : e.clientY + 18) + 'px';
    });
    el.addEventListener('mouseleave', () => { dica.hidden = true; });
  }

  // ---------- filtros ----------
  function filtrarCategoria(c) { estado.categoria = estado.categoria === c ? '' : c; dica.hidden = true; render(); }
  function filtrarDia(d) { estado.dia = estado.dia === d ? '' : d; dica.hidden = true; render(); }

  // ---------- render ----------
  function render() {
    const doMes = GASTOS.filter(t => t.mes === estado.mes);
    const grupos = porCategoria(doMes);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    if (estado.categoria && !grupos.some(g => g.nome === estado.categoria)) estado.categoria = '';
    const cob = cobertura();
    topo(cob);
    kpis(doMes, grupos, total, cob);
    pizza(grupos, total);
    categorias(grupos, total);
    dias(doMes, cob);
    lancamentos(doMes);
  }

  function topo(cob) {
    $('sobretitulo').textContent = `${capital(nomeMes(estado.mes))} de ${estado.mes.slice(0, 4)}`;
    $('periodo').textContent = cob.de
      ? `Para onde foi o dinheiro de ${dm(cob.de)} a ${dm(cob.ate)}${cob.completo ? '' : ' · mês em andamento'}`
      : 'Para onde foi o dinheiro';
    $('mesTexto').textContent = `${capital(nomeMes(estado.mes))} ${estado.mes.slice(0, 4)}`;
    $('rodape').textContent = F.atualizadoEm ? `Atualizado em ${F.atualizadoEm.split('-').reverse().join('/')} · dados processados no chat` : '';
  }

  function kpis(doMes, grupos, total, cob) {
    const fixo = soma(doMes.filter(t => FIXAS.includes(t.categoria)));
    const outros = soma(doMes.filter(t => t.categoria === OUTROS));
    const cartao = (rotulo, valor, nota, cls = '') =>
      `<article class="kpi ${cls}"><p class="kpi-rotulo">${esc(rotulo)}</p><p class="kpi-valor">${esc(valor)}</p><p class="kpi-nota">${esc(nota)}</p></article>`;
    $('kpis').innerHTML =
      cartao('Total gasto', moeda(total), `${gastosTxt(qtd(doMes))} em ${grupos.length} categorias`, 'destaque') +
      cartao('Média por dia', cob.dias ? moeda(total / cob.dias) : '—', cob.dias ? `em ${cob.dias} dias de extrato` : '') +
      cartao('Gastos fixos', total ? pct(fixo / total, 0) : '—', `${moeda(fixo)} em aluguel, contas e assinaturas`) +
      cartao('Sem destino (Outros)', moeda(outros), total ? `${pct(outros / total)} do total` : '');
  }

  function corTexto(hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#18201d' : '#ffffff';
  }

  function pizza(grupos, total) {
    const caixa = $('pizza');
    caixa.classList.toggle('filtrando', !!estado.categoria);
    if (!total) { caixa.innerHTML = ''; return; }
    const C = 160, R = 154;
    const ponto = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)].map(n => n.toFixed(2));
    let a = -Math.PI / 2, fatias = '', rotulos = '';
    for (const g of grupos) {
      const frac = g.total / total, a1 = a + frac * 2 * Math.PI, cor = corDe(g.nome);
      const forma = frac > 0.9999
        ? `<circle cx="${C}" cy="${C}" r="${R}" fill="${cor}"/>`
        : `<path d="M${C} ${C} L${ponto(R, a).join(' ')} A${R} ${R} 0 ${a1 - a > Math.PI ? 1 : 0} 1 ${ponto(R, a1).join(' ')} Z" fill="${cor}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
      fatias += `<g class="fatia${g.nome === estado.categoria ? ' ativa' : ''}" data-cat="${esc(g.nome)}">${forma}</g>`;
      // percentual escrito dentro das fatias em que cabe; as menores ficam na tabela ao lado
      if (frac >= 0.045) {
        const [x, y] = ponto(R * 0.66, a + frac * Math.PI);
        rotulos += `<text class="fatia-rotulo" x="${x}" y="${y}" fill="${corTexto(cor)}" text-anchor="middle" dominant-baseline="central">${Math.round(frac * 100)}%</text>`;
      }
      a = a1;
    }
    caixa.innerHTML = `<svg viewBox="0 0 320 320" role="img" aria-label="Pizza com todos os gastos por categoria">${fatias}${rotulos}</svg>`;
    caixa.querySelectorAll('.fatia').forEach(el => {
      const g = grupos.find(x => x.nome === el.dataset.cat);
      comDica(el, `<b>${esc(g.nome)}</b>${moeda(g.total)} · ${pct(g.total / total)}`);
      el.addEventListener('click', () => filtrarCategoria(g.nome));
    });
  }

  function categorias(grupos, total) {
    const tabela = $('categorias').closest('table');
    tabela.classList.toggle('filtrando', !!estado.categoria);
    const maior = grupos.length ? grupos[0].total : 1;
    $('categorias').innerHTML = grupos.map(g => `
      <tr class="${g.nome === estado.categoria ? 'ativa' : ''}" data-cat="${esc(g.nome)}" tabindex="0">
        <td><span class="cat-nome"><span class="ponto" style="background:${corDe(g.nome)}"></span>${esc(g.nome)}${FIXAS.includes(g.nome) ? '<span class="tag">fixo</span>' : ''}</span></td>
        <td class="c-barra"><div class="barra"><i style="width:${(g.total / maior * 100).toFixed(1)}%;background:${corDe(g.nome)}"></i></div></td>
        <td class="num">${moeda(g.total)}</td>
        <td class="num pct">${pct(g.total / total)}</td>
      </tr>`).join('');
    $('categoriasTotal').innerHTML = `<tr><td>Total</td><td class="c-barra"></td><td class="num">${moeda(total)}</td><td class="num pct">100%</td></tr>`;
    $('categorias').querySelectorAll('tr').forEach(tr => {
      const g = grupos.find(x => x.nome === tr.dataset.cat);
      const lugares = [...new Set(g.itens.map(t => t.nome))];
      comDica(tr, `<b>${esc(g.nome)}</b>${gastosTxt(qtd(g.itens))} ·${esc(lugares.slice(0, 4).join(', '))}${lugares.length > 4 ? '…' : ''}`);
      tr.addEventListener('click', () => filtrarCategoria(g.nome));
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtrarCategoria(g.nome); } });
    });
  }

  function dias(doMes, cob) {
    const lista = estado.categoria ? doMes.filter(t => t.categoria === estado.categoria) : doMes;
    const n = cob.ultimoDia;
    const valores = Array.from({ length: n }, (_, i) => soma(lista.filter(t => +t.data.slice(8) === i + 1)));
    const max = Math.max(1, ...valores);
    const ultimoComDado = cob.ate ? +cob.ate.slice(8) : n;
    const caixa = $('dias');
    caixa.classList.toggle('filtrando', !!estado.dia);
    caixa.innerHTML = valores.map((v, i) => {
      const d = i + 1, iso = `${estado.mes}-${String(d).padStart(2, '0')}`, sem = new Date(iso + 'T12:00').getDay();
      const cls = ['dia', d > ultimoComDado ? 'futuro' : '', sem % 6 === 0 ? 'fds' : '', estado.dia === iso ? 'ativa' : ''].join(' ');
      return `<div class="${cls}" data-dia="${iso}"><div class="d-trilho"><div class="d-cheio" style="--p:${Math.max(0, v / max).toFixed(4)}"></div></div><span class="d-num">${d}</span></div>`;
    }).join('');
    const maiorDia = valores.indexOf(Math.max(...valores)) + 1;
    $('subDias').textContent = (estado.categoria ? `Só ${estado.categoria} · ` : '') +
      (valores.some(v => v > 0) ? `Maior dia: ${String(maiorDia).padStart(2, '0')}/${estado.mes.slice(5)} (${moeda(valores[maiorDia - 1])}) · toque num dia para filtrar` : 'Sem gastos');
    caixa.querySelectorAll('.dia').forEach(el => {
      const iso = el.dataset.dia, d = +iso.slice(8);
      const txt = d > ultimoComDado ? 'ainda não está no extrato' : valores[d - 1] > 0.005 ? moeda(valores[d - 1]) : 'nenhum gasto';
      comDica(el, `<b>${capital(diaSemana(iso))}, ${dm(iso)}</b>${txt}`);
      if (d <= ultimoComDado) el.addEventListener('click', () => filtrarDia(iso));
    });
  }

  function lancamentos(doMes) {
    let lista = doMes;
    if (estado.categoria) lista = lista.filter(t => t.categoria === estado.categoria);
    if (estado.dia) lista = lista.filter(t => t.data === estado.dia);
    lista = lista.slice().sort((a, b) => b.data.localeCompare(a.data) || a.valor - b.valor);

    const partes = [estado.categoria, estado.dia && dm(estado.dia)].filter(Boolean);
    const filtro = $('filtro');
    filtro.hidden = !partes.length;
    filtro.innerHTML = partes.length ? `Filtro: ${esc(partes.join(' · '))} <button type="button" id="limpar">limpar</button>` : '';
    if (partes.length) $('limpar').addEventListener('click', () => { estado.categoria = ''; estado.dia = ''; render(); });
    $('subLanc').textContent = `${gastosTxt(qtd(lista))} · ${moeda(soma(lista))}` + (lista.some(t => t.valor > 0) ? ' (trocos e reembolsos já descontados)' : '');

    const datas = [...new Set(lista.map(t => t.data))];
    $('lancamentos').innerHTML = datas.map(d => {
      const itens = lista.filter(t => t.data === d);
      return `<div class="grupo-dia">
        <div class="grupo-topo"><strong>${capital(diaSemana(d))}, ${dm(d)}</strong><span>${moeda(soma(itens))}</span></div>
        ${itens.map(t => `
        <div class="lanc">
          <div class="l-nome">${esc(t.nome)}<span class="l-tipo">${esc(t.tipo)}</span></div>
          <div class="l-obs">${t.obs ? esc(t.obs) : '<span class="vazio">Sem observação</span>'}${t.nota ? `<span class="l-nota">${esc(t.nota)}</span>` : ''}</div>
          <div class="l-cat"><span class="ponto" style="background:${corDe(t.categoria)}"></span>${esc(t.categoria)}</div>
          <div class="l-valor ${t.valor > 0 ? 'volta' : ''}">${t.valor > 0 ? '− ' + moeda(t.valor) : moeda(-t.valor)}</div>
        </div>`).join('')}
      </div>`;
    }).join('') + (lista.length ? `<div class="lanc-total"><span>Total</span><span>${moeda(soma(lista))}</span></div>` : '<p class="cartao-sub">Nenhum lançamento.</p>');
  }

  // ---------- início ----------
  if (LISTA_MESES.length > 1) {
    $('mesTexto').hidden = true;
    const sel = $('selMes');
    sel.hidden = false;
    sel.innerHTML = LISTA_MESES.slice().reverse().map(m => `<option value="${m}">${capital(nomeMes(m))} ${m.slice(0, 4)}</option>`).join('');
    sel.value = estado.mes;
    sel.addEventListener('change', e => { estado.mes = e.target.value; estado.categoria = ''; estado.dia = ''; render(); });
  }
  render();
})();
