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
  };
  const corDe = c => CORES[c] || '#c9cbc4';

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const $ = id => document.getElementById(id);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const moeda = v => brl.format(v);
  const pct = v => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dm = iso => iso.slice(8) + '/' + iso.slice(5, 7);
  const nomeMes = m => { const t = MESES[+m.slice(5) - 1]; return `${t[0].toUpperCase()}${t.slice(1)} de ${m.slice(0, 4)}`; };

  // ---------- dados ----------
  const F = window.FINANCAS || { transacoes: [], extratos: [] };
  // Só despesas: valor que volta numa categoria de gasto (troco, reembolso) abate o gasto.
  const GASTOS = F.transacoes
    .filter(t => !NEUTRAS.includes(t.categoria) && !RECEITAS.includes(t.categoria))
    .map(t => ({ ...t, gasto: -t.valor, mes: t.data.slice(0, 7) }));
  const LISTA_MESES = [...new Set(GASTOS.map(t => t.mes))].sort();

  const estado = { mes: LISTA_MESES[LISTA_MESES.length - 1] || '', categoria: '' };

  const soma = l => l.reduce((s, t) => s + t.gasto, 0);
  const qtd = l => l.filter(t => t.valor < 0).length;

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

  // ---------- dica ao passar o mouse ----------
  const dica = $('dica');
  function posicionarDica(e) {
    dica.style.left = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8) + 'px';
    dica.style.top = (e.clientY + 18 + dica.offsetHeight > innerHeight ? e.clientY - dica.offsetHeight - 10 : e.clientY + 18) + 'px';
  }
  function comDica(el, html) {
    el.addEventListener('mouseenter', () => { dica.innerHTML = html; dica.hidden = false; });
    el.addEventListener('mousemove', posicionarDica);
    el.addEventListener('mouseleave', () => { dica.hidden = true; });
  }

  // ---------- render ----------
  function alternar(categoria) {
    estado.categoria = estado.categoria === categoria ? '' : categoria;
    render();
  }

  function render() {
    const lista = GASTOS.filter(t => t.mes === estado.mes);
    const grupos = porCategoria(lista);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    if (estado.categoria && !grupos.some(g => g.nome === estado.categoria)) estado.categoria = '';
    topo();
    resumo(lista, grupos, total);
    pizza(grupos, total);
    legenda(grupos, total);
    categorias(grupos, total);
    lancamentos(lista);
  }

  function topo() {
    const ext = (F.extratos || []).filter(e => e.de.slice(0, 7) <= estado.mes && e.ate.slice(0, 7) >= estado.mes);
    const texto = ext.map(e => `${dm(e.de)} a ${dm(e.ate)}`).join(', ');
    $('periodo').textContent = texto ? `Para onde foi o dinheiro de ${texto}` : 'Para onde foi o dinheiro';
    $('mesTexto').textContent = estado.mes ? nomeMes(estado.mes) : '—';
    $('rodape').textContent = F.atualizadoEm ? `Atualizado em ${F.atualizadoEm.split('-').reverse().join('/')}` : '';
  }

  function resumo(lista, grupos, total) {
    const fixo = soma(lista.filter(t => FIXAS.includes(t.categoria)));
    const outros = soma(lista.filter(t => t.categoria === OUTROS));
    const maior = grupos[0];
    const linha = (rotulo, valor, nota, cls) =>
      `<tr class="${cls || ''}"><td>${esc(rotulo)}${nota ? `<small>${esc(nota)}</small>` : ''}</td><td>${esc(valor)}</td></tr>`;
    $('resumo').innerHTML =
      linha('Total gasto', moeda(total), `${qtd(lista)} gastos`, 'total') +
      linha('Gastos fixos', moeda(fixo), total ? pct(fixo / total) + ' do total' : '') +
      linha('Gastos variáveis', moeda(total - fixo), total ? pct((total - fixo) / total) + ' do total' : '') +
      linha('Maior categoria', maior ? moeda(maior.total) : '—', maior ? maior.nome : '') +
      linha('Sem destino (Outros)', moeda(outros), total ? pct(outros / total) + ' do total' : '');
  }

  function corTexto(hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1c2321' : '#ffffff';
  }

  function pizza(grupos, total) {
    const caixa = $('pizza');
    caixa.classList.toggle('filtrando', !!estado.categoria);
    if (!total) { caixa.innerHTML = ''; return; }
    const C = 160, R = 152;
    const ponto = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
    let a = -Math.PI / 2, svg = '';
    for (const g of grupos) {
      const frac = g.total / total, a1 = a + frac * 2 * Math.PI;
      const cor = corDe(g.nome);
      const ativa = g.nome === estado.categoria ? ' ativa' : '';
      const forma = frac > 0.9999
        ? `<circle cx="${C}" cy="${C}" r="${R}" fill="${cor}"/>`
        : `<path d="M${C} ${C} L${ponto(R, a)} A${R} ${R} 0 ${a1 - a > Math.PI ? 1 : 0} 1 ${ponto(R, a1)} Z" fill="${cor}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
      svg += `<g class="fatia${ativa}" data-cat="${esc(g.nome)}">${forma}</g>`;
      a = a1;
    }
    // Percentual escrito dentro das fatias em que cabe; as menores ficam na legenda.
    a = -Math.PI / 2;
    for (const g of grupos) {
      const frac = g.total / total, meio = a + frac * Math.PI;
      if (frac >= 0.04) {
        const [x, y] = ponto(R * 0.68, meio).split(' ');
        svg += `<text class="fatia-rotulo" x="${x}" y="${y}" fill="${corTexto(corDe(g.nome))}" text-anchor="middle" dominant-baseline="central">${Math.round(frac * 100)}%</text>`;
      }
      a += frac * 2 * Math.PI;
    }
    caixa.innerHTML = `<svg viewBox="0 0 320 320" role="img" aria-label="Gráfico de pizza com todos os gastos por categoria">${svg}</svg>`;
    caixa.querySelectorAll('.fatia').forEach(el => {
      const g = grupos.find(x => x.nome === el.dataset.cat);
      comDica(el, `<b>${esc(g.nome)}</b>${moeda(g.total)} · ${pct(g.total / total)}`);
      el.addEventListener('click', () => { dica.hidden = true; alternar(g.nome); });
    });
  }

  function legenda(grupos, total) {
    const ul = $('legenda');
    ul.classList.toggle('filtrando', !!estado.categoria);
    ul.innerHTML = grupos.map(g => `
      <li><button type="button" class="${g.nome === estado.categoria ? 'ativa' : ''}" data-cat="${esc(g.nome)}">
        <span class="ponto" style="background:${corDe(g.nome)}"></span>
        <span class="leg-nome">${esc(g.nome)}</span>
        <span class="leg-valor">${moeda(g.total)}</span>
        <span class="leg-pct">${Math.round(g.total / total * 100)}%</span>
      </button></li>`).join('');
    ul.querySelectorAll('button').forEach(b => b.addEventListener('click', () => alternar(b.dataset.cat)));
  }

  function categorias(grupos, total) {
    $('categorias').innerHTML = grupos.map(g => {
      const lugares = [...new Set(g.itens.map(t => t.nome))];
      const onde = lugares.slice(0, 3).join(', ') + (lugares.length > 3 ? ` e mais ${lugares.length - 3}` : '');
      return `<tr class="${g.nome === estado.categoria ? 'ativa' : ''}" data-cat="${esc(g.nome)}" tabindex="0">
        <td><span class="cat-celula"><span class="ponto" style="background:${corDe(g.nome)}"></span>${esc(g.nome)}</span></td>
        <td class="onde so-largo">${esc(onde)}</td>
        <td class="so-largo">${FIXAS.includes(g.nome) ? 'Fixo' : 'Variável'}</td>
        <td class="num so-largo">${qtd(g.itens)}</td>
        <td class="num">${moeda(g.total)}</td>
        <td class="num">${pct(g.total / total)}</td>
      </tr>`;
    }).join('');
    const totalQtd = grupos.reduce((s, g) => s + qtd(g.itens), 0);
    $('categoriasTotal').innerHTML = `<tr><td>Total</td><td class="so-largo"></td><td class="so-largo"></td><td class="num so-largo">${totalQtd}</td><td class="num">${moeda(total)}</td><td class="num">100,0%</td></tr>`;
    $('categorias').querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => alternar(tr.dataset.cat));
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(tr.dataset.cat); } });
    });
  }

  function lancamentos(lista) {
    const filtrada = (estado.categoria ? lista.filter(t => t.categoria === estado.categoria) : lista)
      .slice().sort((a, b) => b.data.localeCompare(a.data) || a.valor - b.valor);
    const filtro = $('filtro');
    filtro.hidden = !estado.categoria;
    filtro.innerHTML = estado.categoria ? `Só ${esc(estado.categoria)} <button type="button" class="limpar" id="limpar">ver todos</button>` : '';
    if (estado.categoria) $('limpar').addEventListener('click', () => alternar(estado.categoria));

    $('lancamentos').innerHTML = filtrada.map(t => `
      <tr>
        <td class="data">${dm(t.data)}</td>
        <td class="desc">${esc(t.nome)}<span class="tipo">${esc(t.tipo)}</span></td>
        <td class="cat"><span class="cat-celula"><span class="ponto" style="background:${corDe(t.categoria)}"></span>${esc(t.categoria)}</span></td>
        <td class="obs">${t.obs ? esc(t.obs) : '<span class="obs-vazia">—</span>'}${t.nota ? `<span class="nota">↳ ${esc(t.nota)}</span>` : ''}</td>
        <td class="num ${t.valor > 0 ? 'volta' : ''}">${t.valor > 0 ? '− ' + moeda(t.valor) : moeda(-t.valor)}</td>
      </tr>`).join('');
    $('lancamentosTotal').innerHTML = `<tr><td colspan="4">Total</td><td class="num">${moeda(soma(filtrada))}</td></tr>`;
  }

  // ---------- início ----------
  if (LISTA_MESES.length > 1) {
    $('mesTexto').hidden = true;
    const sel = $('selMes');
    sel.hidden = false;
    sel.innerHTML = LISTA_MESES.slice().reverse().map(m => `<option value="${m}">${nomeMes(m)}</option>`).join('');
    sel.value = estado.mes;
    sel.addEventListener('change', e => { estado.mes = e.target.value; estado.categoria = ''; render(); });
  }
  render();
})();
