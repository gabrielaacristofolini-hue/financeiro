/*
 * Painel "Minhas Despesas" — só visualização, com foco nos gastos e nas categorias.
 * Os dados vêm de dados/transacoes.js (window.FINANCAS), mantido pelo Claude.
 */
(function () {
  'use strict';

  // ---------- regras de cálculo ----------
  const RECEITAS = ['Salário e renda', 'Recebimentos'];
  // Não são gasto nem renda: dinheiro que só mudou de lugar.
  const NEUTRAS = ['Investimentos', 'Transferência entre contas'];
  // Despesas que se repetem todo mês com valor parecido.
  const FIXAS = ['Moradia', 'Contas da casa', 'Assinaturas', 'Educação', 'Academia'];
  // Despesa sem destino conhecido.
  const OUTROS = 'Outros';

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const $ = id => document.getElementById(id);
  const css = nome => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const moeda = v => brl.format(v);
  const moedaCurta = v => Math.abs(v) >= 10000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : brl0.format(v);
  const dataBR = iso => iso.split('-').reverse().join('/');
  const rotuloMes = m => { const [a, n] = m.split('-'); return `${MESES[+n - 1]}/${a.slice(2)}`; };
  const rotuloMesLongo = m => { const [a, n] = m.split('-'); return `${MESES_LONGOS[+n - 1]} de ${a}`; };
  const escapar = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizar = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const encurtar = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

  const estado = { mes: '', categoria: '', busca: '' };
  const graficos = {};

  // ---------- dados ----------
  const TODAS = (window.FINANCAS && window.FINANCAS.transacoes || []).map(t => {
    const natureza = NEUTRAS.includes(t.categoria) ? 'neutra' : RECEITAS.includes(t.categoria) ? 'receita' : 'despesa';
    // Quanto soma no total da sua natureza (reembolsos/estornos abatem a despesa).
    const contrib = natureza === 'despesa' ? -t.valor : natureza === 'receita' ? t.valor : 0;
    return { ...t, natureza, contrib, mes: t.data.slice(0, 7) };
  }).sort((a, b) => a.data.localeCompare(b.data));
  const DESPESAS = TODAS.filter(t => t.natureza === 'despesa');

  const MESES_DADOS = (() => {
    if (!TODAS.length) return [];
    const fim = TODAS[TODAS.length - 1].mes;
    let [a, m] = TODAS[0].mes.split('-').map(Number);
    const lista = [];
    while (true) {
      const k = `${a}-${String(m).padStart(2, '0')}`;
      lista.push(k);
      if (k >= fim) break;
      if (++m > 12) { m = 1; a++; }
    }
    return lista;
  })();

  // Meses cobertos do dia 1 ao último dia pelos extratos (só esses entram em médias e comparações).
  const MESES_COMPLETOS = MESES_DADOS.filter(m => {
    const [a, n] = m.split('-').map(Number);
    const ini = `${m}-01`, fim = `${m}-${String(new Date(a, n, 0).getDate()).padStart(2, '0')}`;
    return ((window.FINANCAS && window.FINANCAS.extratos) || []).some(e => e.de <= ini && e.ate >= fim);
  });

  const soma = lista => lista.reduce((s, t) => s + t.contrib, 0);
  const doMes = (lista, m) => lista.filter(t => t.mes === m);

  function agrupar(lista, chaveFn) {
    const mapa = new Map();
    for (const t of lista) {
      const k = chaveFn(t);
      const g = mapa.get(k) || { chave: k, total: 0, qtd: 0, itens: [] };
      g.total += t.contrib; g.qtd++; g.itens.push(t);
      mapa.set(k, g);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }

  // Categorias em ordem do maior para o menor gasto no total (ordem fixa nos filtros e na matriz).
  const CATEGORIAS = agrupar(DESPESAS, t => t.categoria).map(g => g.chave);

  // ---------- render ----------
  function render() {
    const lista = estado.mes ? doMes(DESPESAS, estado.mes) : DESPESAS;
    renderKpis(lista);
    renderCategorias(lista);
    renderFixas(lista);
    renderMensal();
    renderOnde(lista);
    renderMatriz();
    renderTabela(lista);
  }

  function renderTopo() {
    const f = window.FINANCAS || {};
    const extratos = (f.extratos || []).map(e => `${e.conta}: ${dataBR(e.de)} a ${dataBR(e.ate)}`).join(' · ');
    $('fonteDados').textContent = DESPESAS.length
      ? `${extratos || 'Extratos'} · ${DESPESAS.length} despesas`
      : 'Nenhuma despesa em dados/transacoes.js';
    $('selMes').innerHTML = '<option value="">Todos os meses</option>' +
      MESES_DADOS.slice().reverse().map(m => `<option value="${m}">${rotuloMesLongo(m)}${MESES_COMPLETOS.includes(m) ? '' : ' (incompleto)'}</option>`).join('');
    $('selCategoria').innerHTML = '<option value="">Todas</option>' + CATEGORIAS.map(c => `<option>${escapar(c)}</option>`).join('');
  }

  function sincronizarFiltros() {
    $('selMes').value = estado.mes;
    $('selCategoria').value = estado.categoria;
  }

  function mediaMensal() {
    return MESES_COMPLETOS.length ? MESES_COMPLETOS.reduce((s, m) => s + soma(doMes(DESPESAS, m)), 0) / MESES_COMPLETOS.length : 0;
  }

  function renderKpis(lista) {
    const total = soma(lista);
    $('kpiTotal').textContent = moeda(total);
    const receitas = (estado.mes ? doMes(TODAS, estado.mes) : TODAS).filter(t => t.natureza === 'receita').reduce((s, t) => s + t.contrib, 0);
    $('kpiTotalNota').textContent = `${lista.filter(t => t.valor < 0).length} despesas` +
      (receitas > 0 ? ` · ${pct.format(total / receitas)} do que entrou` : '');

    const media = mediaMensal();
    $('kpiMedia').textContent = media ? moeda(media) : '—';
    if (estado.mes && MESES_COMPLETOS.includes(estado.mes) && MESES_COMPLETOS.length > 1) {
      const outros = MESES_COMPLETOS.filter(m => m !== estado.mes);
      const mediaOutros = outros.reduce((s, m) => s + soma(doMes(DESPESAS, m)), 0) / outros.length;
      const dif = total / mediaOutros - 1;
      $('kpiMediaNota').innerHTML = `este mês: <span class="${dif > 0 ? 'delta-ruim' : 'delta-bom'}">${dif > 0 ? '▲' : '▼'} ${pct.format(Math.abs(dif))}</span> vs. os outros`;
    } else if (estado.mes && !MESES_COMPLETOS.includes(estado.mes)) {
      $('kpiMediaNota').textContent = 'mês selecionado está incompleto no extrato';
    } else {
      $('kpiMediaNota').textContent = MESES_COMPLETOS.length === 1
        ? `só ${rotuloMesLongo(MESES_COMPLETOS[0])} está completo`
        : MESES_COMPLETOS.length ? `${MESES_COMPLETOS.length} meses completos`
        : `aparece quando ${rotuloMesLongo(MESES_DADOS[MESES_DADOS.length - 1] || '2000-01').split(' de ')[0]} estiver completo no extrato`;
    }

    const grupos = agrupar(lista, t => t.categoria).filter(g => g.total > 0.005);
    const maior = grupos.find(g => g.chave !== OUTROS) || grupos[0];
    $('kpiMaior').textContent = maior ? maior.chave : '—';
    $('kpiMaiorNota').textContent = maior ? `${moeda(maior.total)} · ${pct.format(maior.total / total)} do total` : '';

    const outros = lista.filter(t => t.categoria === OUTROS);
    const vOutros = soma(outros);
    $('kpiOutros').textContent = moeda(vOutros);
    $('kpiOutrosNota').textContent = outros.length
      ? `${pct.format(vOutros / total)} do total · ${outros.length} despesas sem destino conhecido`
      : 'tudo categorizado';
  }

  // ---------- gráficos ----------
  // Escreve valores ao lado/em cima das barras e percentuais nas fatias.
  const pluginRotulos = {
    id: 'rotulos',
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.ativo) return;
      const { ctx } = chart;
      ctx.save();
      ctx.font = `${opts.peso || 400} ${opts.tamanho || 12}px ${Chart.defaults.font.family}`;
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((el, i) => {
          const v = ds.data[i];
          if (v == null || (opts.ocultarZero && !v)) return;
          const texto = opts.formato(v, i);
          if (!texto) return;
          ctx.fillStyle = (opts.corFatia && opts.corFatia(i)) || opts.cor || css('--texto');
          const tipo = chart.getDatasetMeta(di).type;
          if (tipo === 'pie' || tipo === 'doughnut') {
            const p = el.tooltipPosition();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(texto, p.x, p.y);
          } else if (chart.options.indexAxis === 'y') {
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(texto, el.x + 8, el.y);
          } else {
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(texto, el.x, el.y - 6);
          }
        });
      });
      ctx.restore();
    },
  };

  function configurarGraficos() {
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = css('--texto-2');
    Chart.defaults.borderColor = css('--grade');
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.display = false;
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: '#0e1513', borderColor: css('--borda'), borderWidth: 1,
      titleColor: css('--texto'), bodyColor: css('--texto-2'), padding: 10, cornerRadius: 8, boxPadding: 4,
    });
    Chart.register(pluginRotulos);
  }

  function desenhar(id, config) {
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart($(id), config);
  }

  const cursorMao = (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; };

  function filtrarCategoria(c) {
    estado.categoria = estado.categoria === c ? '' : c;
    sincronizarFiltros();
    render();
    if (estado.categoria) $('corpoTransacoes').closest('.cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function filtrarMes(m) {
    estado.mes = estado.mes === m ? '' : m;
    sincronizarFiltros();
    render();
  }

  function renderCategorias(lista) {
    const grupos = agrupar(lista, t => t.categoria).filter(g => g.total > 0.005);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    const estreito = $('caixaCategorias').clientWidth < 520;
    $('subCategorias').textContent = estado.mes ? rotuloMesLongo(estado.mes) : 'todos os meses';
    $('caixaCategorias').style.height = Math.max(160, grupos.length * 34 + 30) + 'px';
    const limao = css('--limao'), cinza = css('--verde-medio');
    // "Outros" fica em cinza-esverdeado: é o que ainda não tem destino conhecido.
    const cor = g => g.chave === OUTROS ? cinza : limao;
    desenhar('graficoCategorias', {
      type: 'bar',
      data: {
        labels: grupos.map(g => g.chave),
        datasets: [{
          label: 'Gastos', data: grupos.map(g => g.total),
          backgroundColor: ctx => { const g = grupos[ctx.dataIndex]; return !g ? limao : (!estado.categoria || g.chave === estado.categoria ? cor(g) : cor(g) + '40'); },
          borderRadius: 4, barPercentage: .78, categoryPercentage: .9, maxBarThickness: 22,
        }],
      },
      options: {
        indexAxis: 'y',
        layout: { padding: { right: estreito ? 64 : 130 } },
        scales: {
          x: { display: false, beginAtZero: true },
          y: {
            grid: { display: false }, border: { display: false },
            ticks: { color: css('--texto'), font: { size: estreito ? 12 : 13 }, callback: (_v, i) => encurtar(grupos[i].chave, estreito ? 17 : 30) },
          },
        },
        plugins: {
          tooltip: { callbacks: {
            title: items => grupos[items[0].dataIndex].chave,
            label: c => ` ${moeda(c.parsed.x)} · ${pct.format(c.parsed.x / total)} dos gastos`,
            afterLabel: c => `${grupos[c.dataIndex].qtd} despesas`,
          } },
          rotulos: { ativo: true, formato: v => estreito ? moedaCurta(v) : `${moeda(v)}  ${pct.format(v / total)}`, cor: css('--texto-2') },
        },
        onClick: (_e, els) => { if (els.length) filtrarCategoria(grupos[els[0].index].chave); },
        onHover: cursorMao,
      },
    });
  }

  function renderFixas(lista) {
    const fixas = soma(lista.filter(t => FIXAS.includes(t.categoria)));
    const variaveis = soma(lista.filter(t => !FIXAS.includes(t.categoria)));
    const total = fixas + variaveis;
    desenhar('graficoFixas', {
      type: 'pie',
      data: {
        labels: ['Despesa fixa', 'Despesa variável'],
        datasets: [{ data: [fixas, variaveis], backgroundColor: [css('--verde-fundo'), css('--limao')], borderColor: css('--cartao'), borderWidth: 2 }],
      },
      options: {
        layout: { padding: 6 },
        plugins: {
          tooltip: { callbacks: { label: c => ` ${c.label}: ${moeda(c.parsed)} (${total ? pct.format(c.parsed / total) : '—'})` } },
          rotulos: { ativo: true, formato: v => total && v / total > 0.04 ? pct.format(v / total) : '', tamanho: 14, peso: 600, corFatia: i => i === 0 ? css('--texto') : '#13201a' },
        },
      },
    });
    $('notaFixas').textContent = `Fixas: ${FIXAS.join(', ')}.`;
  }

  function renderMensal() {
    const meses = MESES_DADOS;
    const valores = meses.map(m => soma(doMes(DESPESAS, m)));
    const limao = css('--limao');
    desenhar('graficoMensal', {
      type: 'bar',
      data: {
        labels: meses.map(m => rotuloMes(m) + (MESES_COMPLETOS.includes(m) ? '' : '*')),
        datasets: [{
          label: 'Gastos', data: valores,
          backgroundColor: ctx => !estado.mes || meses[ctx.dataIndex] === estado.mes ? limao : limao + '40',
          borderRadius: 4, maxBarThickness: 56, categoryPercentage: .7,
        }],
      },
      options: {
        layout: { padding: { top: 22 } },
        scales: {
          x: { grid: { display: false }, border: { color: css('--grade') } },
          y: { beginAtZero: true, grid: { color: css('--grade') }, border: { display: false }, ticks: { callback: v => moedaCurta(v), maxTicksLimit: 6 } },
        },
        plugins: {
          tooltip: { callbacks: {
            title: items => rotuloMesLongo(meses[items[0].dataIndex]) + (MESES_COMPLETOS.includes(meses[items[0].dataIndex]) ? '' : ' (incompleto)'),
            label: c => ` Gastos: ${moeda(c.parsed.y)}`,
          } },
          rotulos: { ativo: true, formato: v => moedaCurta(v), ocultarZero: true, tamanho: 12, cor: css('--texto') },
        },
        onClick: (_e, els) => { if (els.length) filtrarMes(meses[els[0].index]); },
        onHover: cursorMao,
      },
    });
    const incompletos = meses.filter(m => !MESES_COMPLETOS.includes(m)).map(rotuloMes);
    $('subMensal').textContent = 'Clique em um mês para filtrar o painel.' +
      (incompletos.length ? ` * ${incompletos.join(' e ')}: mês incompleto no extrato.` : '');
  }

  function renderOnde(lista) {
    const grupos = agrupar(lista, t => t.nome).filter(g => g.total > 0.005).slice(0, 10);
    const max = grupos.length ? grupos[0].total : 0;
    $('listaOnde').innerHTML = grupos.length ? grupos.map(g => `
      <li>
        <span class="r-nome" title="${escapar(g.chave)}">${escapar(g.chave)}</span>
        <span class="r-valor">${moeda(g.total)}</span>
        <span class="r-barra"><i style="width:${(g.total / max * 100).toFixed(1)}%"></i></span>
        <span class="r-meta">${escapar(g.itens[0].categoria)} · ${g.qtd} ${g.qtd > 1 ? 'despesas' : 'despesa'}</span>
      </li>`).join('') : '<li class="vazio">Sem gastos no período.</li>';
  }

  // Tabela categoria × mês; a intensidade do verde mostra o tamanho do gasto (escala de um só tom).
  function renderMatriz() {
    const meses = MESES_DADOS;
    const valor = (c, m) => soma(DESPESAS.filter(t => t.categoria === c && t.mes === m));
    const linhas = CATEGORIAS.map(c => ({ c, v: meses.map(m => valor(c, m)) }));
    const max = Math.max(0, ...linhas.flatMap(l => l.v));
    const celula = (v, m) => {
      if (Math.abs(v) < 0.005) return `<td class="num vazio-cel" data-mes="${m}">—</td>`;
      const a = max ? Math.max(0.06, v / max) : 0;
      const forte = a > 0.55;
      return `<td class="num" data-mes="${m}" style="background:rgba(180,240,95,${(a * 0.85).toFixed(2)});${forte ? 'color:#13201a;font-weight:600' : ''}">${moeda(v)}</td>`;
    };
    const totais = meses.map(m => soma(doMes(DESPESAS, m)));
    $('tabelaMatriz').innerHTML =
      `<thead><tr><th>Categoria</th>${meses.map(m => `<th class="num${m === estado.mes ? ' sel' : ''}">${rotuloMes(m)}${MESES_COMPLETOS.includes(m) ? '' : '*'}</th>`).join('')}<th class="num">Total</th></tr></thead>` +
      '<tbody>' + linhas.map(l => `<tr class="${l.c === estado.categoria ? 'sel' : ''}" data-cat="${escapar(l.c)}"><td class="cat-nome">${escapar(l.c)}</td>${l.v.map((v, i) => celula(v, meses[i])).join('')}<td class="num total">${moeda(l.v.reduce((s, v) => s + v, 0))}</td></tr>`).join('') + '</tbody>' +
      `<tfoot><tr><td>Total</td>${totais.map(v => `<td class="num">${moeda(v)}</td>`).join('')}<td class="num">${moeda(totais.reduce((s, v) => s + v, 0))}</td></tr></tfoot>`;
  }

  function renderTabela(lista) {
    const busca = normalizar(estado.busca).trim();
    let linhas = lista.slice().sort((a, b) => b.data.localeCompare(a.data) || a.valor - b.valor);
    if (estado.categoria) linhas = linhas.filter(t => t.categoria === estado.categoria);
    if (busca) linhas = linhas.filter(t => normalizar(`${t.nome} ${t.tipo} ${t.categoria}`).includes(busca));

    $('corpoTransacoes').innerHTML = linhas.length ? linhas.map(t => `
      <tr>
        <td class="data">${dataBR(t.data).slice(0, 5)}<span class="ano">${dataBR(t.data).slice(5)}</span></td>
        <td class="desc">${escapar(t.nome)}<small>${escapar(t.tipo)}</small></td>
        <td class="cat">${escapar(t.categoria)}</td>
        <td class="num ${t.valor > 0 ? 'valor-pos' : ''}">${moeda(t.valor)}</td>
      </tr>`).join('') : '<tr><td colspan="4" class="vazio">Nenhuma despesa encontrada.</td></tr>';

    const filtros = [estado.mes && rotuloMesLongo(estado.mes), estado.categoria, estado.busca && `"${estado.busca}"`].filter(Boolean);
    $('subTransacoes').textContent = filtros.length ? `Filtro: ${filtros.join(' · ')}` : 'Todas as despesas';
    $('rodapeTabela').textContent = `${linhas.length} itens · total ${moeda(soma(linhas))}` +
      (linhas.some(t => t.valor > 0) ? ' (reembolsos já descontados)' : '');
  }

  // ---------- eventos ----------
  function ligarEventos() {
    $('selMes').addEventListener('change', e => { estado.mes = e.target.value; render(); });
    $('selCategoria').addEventListener('change', e => { estado.categoria = e.target.value; render(); });
    let espera;
    $('inputBusca').addEventListener('input', e => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        estado.busca = e.target.value;
        renderTabela(estado.mes ? doMes(DESPESAS, estado.mes) : DESPESAS);
      }, 150);
    });
    // Clique na matriz: célula filtra mês + categoria; nome da categoria filtra só a categoria.
    $('tabelaMatriz').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-cat]');
      if (!tr) return;
      const td = e.target.closest('td[data-mes]');
      if (td) { estado.mes = td.dataset.mes; estado.categoria = ''; }
      filtrarCategoria(tr.dataset.cat);
    });
    // Ao mudar bastante a largura (girar o celular etc.), redesenha para ajustar os rótulos.
    let larguraAnterior = innerWidth, esperaResize;
    addEventListener('resize', () => {
      clearTimeout(esperaResize);
      esperaResize = setTimeout(() => {
        if (Math.abs(innerWidth - larguraAnterior) > 40) { larguraAnterior = innerWidth; render(); }
      }, 250);
    });
  }

  if (!window.Chart) {
    $('fonteDados').textContent = 'Não foi possível carregar a biblioteca de gráficos. Verifique a internet e recarregue.';
    return;
  }
  configurarGraficos();
  renderTopo();
  ligarEventos();
  render();
})();
