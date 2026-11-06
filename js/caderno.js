/*
 * "Caderno de contas" — versão rústica do painel, com pizza colorida, tracker e diário.
 * Usa os mesmos dados de dados/transacoes.js (window.FINANCAS).
 */
(function () {
  'use strict';

  // ---------- regras (as mesmas do painel) ----------
  const RECEITAS = ['Salário e renda', 'Recebimentos'];
  const NEUTRAS = ['Investimentos', 'Transferência entre contas'];
  const FIXAS = ['Moradia', 'Contas da casa', 'Assinaturas', 'Educação', 'Academia'];
  const OUTROS = 'Outros';

  // Cor fixa por categoria (a cor segue a categoria, nunca a posição no ranking).
  // Paleta categórica validada para daltonismo; "Outros" fica em grafite (sem destino).
  const CORES = {
    'Moradia': '#2a78d6',
    'Contas da casa': '#eb6834',
    'Transporte': '#1baf7a',
    'Mercado': '#eda100',
    'Lazer': '#e87ba4',
    'Alimentação': '#e34948',
    'Saúde': '#6250d6',
    'Compras': '#008300',
    [OUTROS]: '#9b968a',
  };
  const COR_DEMAIS = '#cfc6b0'; // categorias sem cor própria entram juntas em "Demais categorias"
  const DEMAIS = 'Demais categorias';
  const corDe = c => CORES[c] || COR_DEMAIS;

  const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const $ = id => document.getElementById(id);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const pct0 = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
  const pct1 = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const moeda = v => brl.format(v);
  const moedaInteira = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const escapar = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dataBR = iso => iso.split('-').reverse().join('/');
  const nomeMes = m => { const [a, n] = m.split('-'); return `${MESES_LONGOS[+n - 1]} de ${a}`; };

  // ---------- dados ----------
  const F = window.FINANCAS || { transacoes: [], extratos: [] };
  const TODAS = F.transacoes.map(t => {
    const natureza = NEUTRAS.includes(t.categoria) ? 'neutra' : RECEITAS.includes(t.categoria) ? 'receita' : 'despesa';
    const contrib = natureza === 'despesa' ? -t.valor : natureza === 'receita' ? t.valor : 0;
    return { ...t, natureza, contrib, mes: t.data.slice(0, 7), grupo: CORES[t.categoria] ? t.categoria : DEMAIS };
  }).sort((a, b) => a.data.localeCompare(b.data));
  const MESES = [...new Set(TODAS.map(t => t.mes))].sort();

  const estado = { mes: MESES[MESES.length - 1] || '', categoria: '' };

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

  // ---------- balão (tooltip) ----------
  const balao = $('balao');
  function mostrarBalao(e, html) {
    balao.innerHTML = html;
    balao.hidden = false;
    const x = Math.min(e.clientX + 14, innerWidth - balao.offsetWidth - 8);
    const y = e.clientY + 16 + balao.offsetHeight > innerHeight ? e.clientY - balao.offsetHeight - 12 : e.clientY + 16;
    balao.style.left = x + 'px';
    balao.style.top = y + 'px';
  }
  const esconderBalao = () => { balao.hidden = true; };

  // ---------- render ----------
  function render() {
    const doMes = TODAS.filter(t => t.mes === estado.mes);
    const despesas = doMes.filter(t => t.natureza === 'despesa');
    const grupos = agrupar(despesas, t => t.grupo).filter(g => g.total > 0.005);
    const total = grupos.reduce((s, g) => s + g.total, 0);

    renderCabecalho(doMes);
    renderPizza(grupos, total);
    renderLista(grupos, total);
    renderPostits(doMes, despesas, total);
    renderTracker(despesas);
    renderDiario(despesas);
  }

  function renderCabecalho(doMes) {
    $('titulo').innerHTML = `Despesas de <span class="sublinhado">${escapar(nomeMes(estado.mes).split(' de ')[0])}</span>`;
    const ext = (F.extratos || []).filter(e => e.de.slice(0, 7) <= estado.mes && e.ate.slice(0, 7) >= estado.mes);
    const de = ext.length ? ext.map(e => e.de).sort()[0] : doMes[0]?.data;
    const ate = ext.length ? ext.map(e => e.ate).sort().slice(-1)[0] : doMes[doMes.length - 1]?.data;
    const [a, n] = estado.mes.split('-').map(Number);
    const ultimoDia = new Date(a, n, 0).getDate();
    const completo = de && ate && de.endsWith('-01') && +ate.slice(8) >= ultimoDia;
    $('periodo').textContent = de ? `extrato de ${dataBR(de).slice(0, 5)} a ${dataBR(ate).slice(0, 5)}${completo ? '' : ' (mês ainda aberto)'}` : 'sem dados neste mês';
    $('atualizado').textContent = F.atualizadoEm ? dataBR(F.atualizadoEm) : '—';
  }

  // ---------- pizza ----------
  function arco(r0, r1, a0, a1) {
    const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
    return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r1},${r1} 0 ${grande} 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r0},${r0} 0 ${grande} 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`;
  }

  function renderPizza(grupos, total) {
    const caixa = $('pizzaCaixa');
    if (!total) { caixa.innerHTML = '<p class="vazio">nenhum gasto neste mês ainda.</p>'; return; }
    const R = 150, r = 66;
    let a = -Math.PI / 2;
    const fatias = grupos.map(g => {
      const ang = (g.total / total) * Math.PI * 2;
      const f = { ...g, a0: a, a1: a + ang, meio: a + ang / 2, frac: g.total / total };
      a += ang;
      return f;
    });

    // Rótulos à mão só nas fatias com pelo menos 5%; o resto fica na lista ao lado.
    // No celular a pizza ocupa a largura toda e a lista logo abaixo faz o papel de legenda.
    const estreito = caixa.clientWidth < 480;
    const rotulos = estreito ? [] : fatias.filter(f => f.frac >= 0.05).map(f => {
      const lado = Math.cos(f.meio) >= 0 ? 1 : -1;
      return { f, lado, y: Math.sin(f.meio) * (R + 34) };
    });
    for (const lado of [1, -1]) {
      const doLado = rotulos.filter(l => l.lado === lado).sort((x, y) => x.y - y.y);
      for (let i = 1; i < doLado.length; i++) if (doLado[i].y - doLado[i - 1].y < 40) doLado[i].y = doLado[i - 1].y + 40;
    }

    const sel = estado.categoria;
    let svg = `<svg viewBox="${estreito ? '-162 -162 330 330' : '-300 -215 600 430'}" role="img" aria-label="Pizza dos gastos por categoria">`;
    // sombra de papel
    svg += `<circle r="${R + 4}" cx="4" cy="6" fill="rgba(36,35,44,.08)"/>`;
    for (const f of fatias) {
      const d = f.frac >= 0.9999 ? arco(r, R, -Math.PI / 2, 1.5 * Math.PI - 0.0001) : arco(r, R, f.a0, f.a1);
      const apagada = sel && sel !== f.chave ? ' apagada' : '';
      svg += `<g class="fatia${apagada}" data-cat="${escapar(f.chave)}" data-meio="${f.meio}">
        <path d="${d}" fill="${corDe(f.chave)}" fill-opacity=".9"/>
        <path d="${d}" fill="url(#hachura)"/>
        <path d="${d}" fill="none" stroke="#24232c" stroke-width="2" stroke-linejoin="round" filter="url(#tremido)"/>
      </g>`;
    }
    for (const l of rotulos) {
      const { f, lado } = l;
      const x0 = Math.cos(f.meio) * (R - 6), y0 = Math.sin(f.meio) * (R - 6);
      const x1 = Math.cos(f.meio) * (R + 18), y1 = Math.sin(f.meio) * (R + 18);
      const x2 = lado * (R + 44);
      svg += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${x1.toFixed(1)},${y1.toFixed(1)} ${x2},${l.y.toFixed(1)}" fill="none" stroke="#c8322f" stroke-width="1.6" filter="url(#tremido)"/>
        <circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="2.6" fill="#c8322f"/>
        <text class="rotulo-fatia" x="${x2 + lado * 6}" y="${(l.y + 6).toFixed(1)}" text-anchor="${lado > 0 ? 'start' : 'end'}">${escapar(f.chave)} <tspan class="pct">${pct0.format(f.frac)}</tspan></text>`;
    }
    svg += `<text class="centro-pizza-valor" text-anchor="middle" y="6">${moedaInteira(total)}</text>
      <text class="centro-pizza-rotulo" text-anchor="middle" y="32">gastos</text></svg>`;
    caixa.innerHTML = svg;

    caixa.querySelectorAll('.fatia').forEach(g => {
      const f = fatias.find(x => x.chave === g.dataset.cat);
      const meio = +g.dataset.meio;
      g.addEventListener('mousemove', e => mostrarBalao(e, `<b>${escapar(f.chave)}</b><span class="v">${moeda(f.total)} · ${pct1.format(f.frac)}</span><br>${f.itens.filter(t => t.valor < 0).length} gasto(s)`));
      g.addEventListener('mouseenter', () => { g.style.transform = `translate(${Math.cos(meio) * 8}px, ${Math.sin(meio) * 8}px)`; });
      g.addEventListener('mouseleave', () => { g.style.transform = ''; esconderBalao(); });
      g.addEventListener('click', () => alternarCategoria(f.chave));
    });
  }

  function renderLista(grupos, total) {
    $('totalGrande').textContent = moeda(total);
    const qtd = grupos.reduce((s, g) => s + g.itens.filter(t => t.valor < 0).length, 0);
    $('totalNota').textContent = `${qtd} gastos em ${grupos.length} categorias`;
    $('listaCategorias').innerHTML = grupos.map(g => {
      const cls = estado.categoria ? (estado.categoria === g.chave ? 'ativa' : 'apagada') : '';
      const nomes = g.chave === DEMAIS ? [...new Set(g.itens.map(t => t.categoria))].join(', ') : '';
      const meta = g.chave === OUTROS ? 'sem destino conhecido' : nomes;
      return `<li class="${cls}" data-cat="${escapar(g.chave)}">
        <span class="marca-texto" style="background:${corDe(g.chave)}"></span>
        <span class="cat-nome">${escapar(g.chave)}</span>
        <span class="cat-valor">${moeda(g.total)} · ${pct0.format(g.total / total)}</span>
        ${meta ? `<span class="cat-meta">${escapar(meta)}</span>` : ''}
      </li>`;
    }).join('');
    $('listaCategorias').querySelectorAll('li').forEach(li => li.addEventListener('click', () => alternarCategoria(li.dataset.cat)));
  }

  function alternarCategoria(c) {
    estado.categoria = estado.categoria === c ? '' : c;
    render();
  }

  // ---------- post-its ----------
  function renderPostits(doMes, despesas, total) {
    const fixas = soma(despesas.filter(t => FIXAS.includes(t.categoria)));
    const maior = despesas.filter(t => t.valor < 0).sort((a, b) => a.valor - b.valor)[0];
    const outros = despesas.filter(t => t.categoria === OUTROS);
    const receitas = soma(doMes.filter(t => t.natureza === 'receita'));
    const notas = [
      `<h3>fixo x variável</h3><span class="grande">${total ? pct0.format(fixas / total) : '—'} fixo</span>
       <p>${moeda(fixas)} em contas que se repetem (aluguel, energia…). O resto, ${moeda(total - fixas)}, varia.</p>`,
      maior ? `<h3>maior gasto</h3><span class="grande">${moeda(-maior.valor)}</span>
       <p>${escapar(maior.nome)}${maior.obs ? ` — ${escapar(maior.obs)}` : ''} (${dataBR(maior.data).slice(0, 5)})</p>` : '<h3>maior gasto</h3><p>—</p>',
      `<h3>sem destino ("outros")</h3><span class="grande">${moeda(soma(outros))}</span>
       <p>${outros.length ? `${outros.length} gasto(s) que não sei o que foi. Me conta!` : 'tudo com destino conhecido 🎉'}</p>`,
      `<h3>do que entrou</h3><span class="grande">${receitas ? pct0.format(total / receitas) : '—'} gasto</span>
       <p>${receitas ? `de ${moeda(receitas)} recebidos no mês até agora.` : 'nenhuma entrada registrada no mês.'}</p>`,
    ];
    $('postits').innerHTML = notas.map(n => `<article class="postit">${n}</article>`).join('');
  }

  // ---------- tracker (bullet journal) ----------
  function renderTracker(despesas) {
    const [a, n] = estado.mes.split('-').map(Number);
    const dias = new Date(a, n, 0).getDate();
    const ate = (F.extratos || []).map(e => e.ate).filter(d => d.slice(0, 7) === estado.mes).sort().slice(-1)[0];
    const ultimoComDado = ate ? +ate.slice(8) : dias;
    const grupos = agrupar(despesas, t => t.grupo).filter(g => g.total > 0.005);
    const porDia = (lista, d) => lista.filter(t => +t.data.slice(8) === d);
    const maxDia = Math.max(1, ...grupos.flatMap(g => Array.from({ length: dias }, (_, i) => soma(porDia(g.itens, i + 1)))));
    const diaSemana = d => new Date(a, n - 1, d).getDay();

    let html = '<thead><tr><th class="linha-nome"></th>';
    for (let d = 1; d <= dias; d++) {
      const tem = porDia(despesas, d).length;
      html += `<th class="${tem ? 'com-gasto' : ''}" title="${DIAS_SEMANA[diaSemana(d)]}">${d}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const g of grupos) {
      const apagada = estado.categoria && estado.categoria !== g.chave ? ' style="opacity:.3"' : '';
      html += `<tr${apagada}><th class="linha-nome"><i style="background:${corDe(g.chave)}"></i>${escapar(g.chave)}</th>`;
      for (let d = 1; d <= dias; d++) {
        const itens = porDia(g.itens, d);
        const v = soma(itens);
        const classes = [diaSemana(d) % 6 === 0 ? 'fim-semana' : '', d > ultimoComDado ? 'futuro' : ''].join(' ').trim();
        if (!itens.length) { html += `<td class="${classes}"></td>`; continue; }
        const tam = v > 0 ? Math.round(8 + 16 * Math.sqrt(v / maxDia)) : 8;
        const detalhe = itens.map(t => `${escapar(t.nome)}: ${moeda(-t.valor)}`).join('<br>');
        html += `<td class="${classes}"><span class="bolinha" style="width:${tam}px;height:${tam}px;background:${v > 0 ? corDe(g.chave) : 'transparent'}"
          data-info="${escapar(`<b>${g.chave} · ${dataBR(itens[0].data).slice(0, 5)}</b><span class='v'>${moeda(v)}</span><br>${detalhe}`)}"></span></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody><tfoot><tr><th class="linha-nome" style="font-size:15px;color:var(--tinta-2)">total do dia</th>';
    for (let d = 1; d <= dias; d++) {
      const v = soma(porDia(despesas, d));
      // valores grandes abreviados (1,5k) para caber na coluna do dia
      const txt = Math.abs(v) < 0.005 ? '' : Math.abs(v) >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : Math.round(v);
      html += `<td title="${Math.abs(v) > 0.005 ? moeda(v) : ''}">${txt}</td>`;
    }
    html += '</tr></tfoot>';
    $('tracker').innerHTML = html;
    $('tracker').querySelectorAll('.bolinha').forEach(b => {
      b.addEventListener('mousemove', e => mostrarBalao(e, b.dataset.info));
      b.addEventListener('mouseleave', esconderBalao);
    });
  }

  // ---------- diário ----------
  function renderDiario(despesas) {
    const lista = estado.categoria ? despesas.filter(t => t.grupo === estado.categoria) : despesas;
    $('filtroAtivo').innerHTML = estado.categoria
      ? `só <b>${escapar(estado.categoria)}</b> · <a href="#" id="limparFiltro" style="color:inherit">ver tudo</a>` : 'do mais recente para o mais antigo';
    const limpar = $('limparFiltro');
    if (limpar) limpar.addEventListener('click', e => { e.preventDefault(); alternarCategoria(estado.categoria); });

    const dias = [...new Set(lista.map(t => t.data))].sort().reverse();
    $('diario').innerHTML = dias.length ? dias.map(d => {
      const itens = lista.filter(t => t.data === d).sort((a, b) => a.valor - b.valor);
      const [a, m, dd] = d.split('-').map(Number);
      const semana = DIAS_SEMANA[new Date(a, m - 1, dd).getDay()];
      return `<div class="dia"><h3>${semana}, ${dataBR(d).slice(0, 5)} <small>${moeda(soma(itens))}</small></h3>
        ${itens.map(t => `<div class="item">
          <span class="ponto" style="background:${corDe(t.grupo)}"></span>
          <span class="nome">${escapar(t.nome)}<span class="cat">${escapar(t.categoria)}</span></span>
          <span class="valor ${t.valor > 0 ? 'volta' : ''}">${t.valor > 0 ? '+ ' + moeda(t.valor) + ' (voltou)' : moeda(-t.valor)}</span>
          ${t.obs ? `<span class="obs">“${escapar(t.obs)}”</span>` : ''}
          ${t.nota ? `<span class="nota">↳ ${escapar(t.nota)}</span>` : ''}
        </div>`).join('')}
      </div>`;
    }).join('') : '<p class="vazio">nada por aqui.</p>';
  }

  // ---------- início ----------
  $('selMes').innerHTML = MESES.slice().reverse().map(m => `<option value="${m}">${nomeMes(m)}</option>`).join('');
  $('selMes').value = estado.mes;
  $('selMes').addEventListener('change', e => { estado.mes = e.target.value; estado.categoria = ''; render(); });
  addEventListener('scroll', esconderBalao, { passive: true });
  // girar o celular / redimensionar: redesenha a pizza (rótulos aparecem ou somem)
  let larguraAnterior = innerWidth, espera;
  addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (Math.abs(innerWidth - larguraAnterior) > 40) { larguraAnterior = innerWidth; render(); } }, 250);
  });
  render();
})();
