/*
 * Painel "Minhas Finanças" — só visualização.
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
  const BASE = (window.FINANCAS && window.FINANCAS.transacoes || []).map(t => {
    const natureza = NEUTRAS.includes(t.categoria) ? 'neutra' : RECEITAS.includes(t.categoria) ? 'receita' : 'despesa';
    // Quanto a transação soma no total da sua natureza (estornos/reembolsos reduzem a despesa).
    const contrib = natureza === 'despesa' ? -t.valor : natureza === 'receita' ? t.valor : 0;
    return { ...t, natureza, contrib, mes: t.data.slice(0, 7) };
  }).sort((a, b) => a.data.localeCompare(b.data));

  const MESES_DADOS = (() => {
    if (!BASE.length) return [];
    const fim = BASE[BASE.length - 1].mes;
    let [a, m] = BASE[0].mes.split('-').map(Number);
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
    if (!BASE.length) return false;
    const [a, n] = m.split('-').map(Number);
    const ini = `${m}-01`, fim = `${m}-${String(new Date(a, n, 0).getDate()).padStart(2, '0')}`;
    return (window.FINANCAS.extratos || []).some(e => e.de <= ini && e.ate >= fim);
  });

  const CATEGORIAS =[...new Set(BASE.map(t => t.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const somar = (lista, natureza) => lista.filter(t => t.natureza === natureza).reduce((s, t) => s + t.contrib, 0);

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

  // ---------- render ----------
  function render() {
    const lista = estado.mes ? BASE.filter(t => t.mes === estado.mes) : BASE;
    renderKpis(lista);
    renderMensal();
    renderMedidor(lista);
    renderCategorias(lista);
    renderFixas(lista);
    renderOnde(lista);
    renderReceita(lista);
    renderTabela(lista);
  }

  function renderTopo() {
    const f = window.FINANCAS || {};
    const extratos = (f.extratos || []).map(e => `${e.conta}: ${dataBR(e.de)} a ${dataBR(e.ate)}`).join(' · ');
    $('fonteDados').textContent = BASE.length
      ? `${extratos || 'Extratos'} · ${BASE.length} transações`
      : 'Nenhuma transação em dados/transacoes.js';

    $('selMes').innerHTML = '<option value="">Todos os meses</option>' +
      MESES_DADOS.slice().reverse().map(m => `<option value="${m}">${rotuloMesLongo(m)}</option>`).join('');
    $('selCategoria').innerHTML = '<option value="">Todas</option>' + CATEGORIAS.map(c => `<option>${escapar(c)}</option>`).join('');
  }

  function sincronizarFiltros() {
    $('selMes').value = estado.mes;
    $('selCategoria').value = estado.categoria;
  }

  function renderKpis(lista) {
    const receitas = somar(lista, 'receita');
    const despesas = somar(lista, 'despesa');
    const saldo = receitas - despesas;
    $('kpiReceitas').textContent = moeda(receitas);
    $('kpiDespesas').textContent = moeda(despesas);
    $('kpiSaldo').textContent = moeda(saldo);
    $('kpiSaldo').className = 'kpi-valor ' + (saldo < 0 ? 'delta-ruim' : '');
    $('kpiReceitasNota').textContent = `${lista.filter(t => t.natureza === 'receita' && t.valor > 0).length} entradas`;

    if (estado.mes) {
      const outros = MESES_COMPLETOS.filter(m => m !== estado.mes);
      const media = outros.length ? outros.reduce((s, m) => s + somar(BASE.filter(t => t.mes === m), 'despesa'), 0) / outros.length : 0;
      const dif = media ? despesas / media - 1 : 0;
      if (!MESES_COMPLETOS.includes(estado.mes)) $('kpiDespesasNota').textContent = 'mês incompleto no extrato';
      else $('kpiDespesasNota').innerHTML = media
        ? `<span class="${dif > 0 ? 'delta-ruim' : 'delta-bom'}">${dif > 0 ? '▲' : '▼'} ${pct.format(Math.abs(dif))}</span> vs. média dos outros meses completos`
        : 'único mês completo até agora';
      $('kpiSaldoNota').textContent = rotuloMesLongo(estado.mes);
    } else {
      const mediaCompletos = MESES_COMPLETOS.length
        ? MESES_COMPLETOS.reduce((s, m) => s + somar(BASE.filter(t => t.mes === m), 'despesa'), 0) / MESES_COMPLETOS.length : 0;
      $('kpiDespesasNota').textContent = MESES_COMPLETOS.length
        ? `média de ${moeda(mediaCompletos)} por mês completo` : '';
      $('kpiSaldoNota').textContent = 'receitas − despesas';
    }

    const inv = lista.filter(t => t.categoria === 'Investimentos');
    const aplicado = -inv.filter(t => t.valor < 0).reduce((s, t) => s + t.valor, 0);
    const resgatado = inv.filter(t => t.valor > 0).reduce((s, t) => s + t.valor, 0);
    $('kpiInvestido').textContent = moeda(aplicado - resgatado);
    $('kpiInvestidoNota').textContent = inv.length ? `aplicado ${moedaCurta(aplicado)} · resgatado ${moedaCurta(resgatado)}` : 'nenhuma aplicação no período';
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
        const meta = chart.getDatasetMeta(di);
        meta.data.forEach((el, i) => {
          const v = ds.data[i];
          if (v == null || (opts.ocultarZero && !v)) return;
          const texto = opts.formato(v, i);
          if (!texto) return;
          ctx.fillStyle = (opts.corFatia && opts.corFatia(i)) || opts.cor || css('--texto');
          if (meta.type === 'pie' || meta.type === 'doughnut') {
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

  function renderMensal() {
    const meses = MESES_DADOS;
    const rec = meses.map(m => somar(BASE.filter(t => t.mes === m), 'receita'));
    const des = meses.map(m => somar(BASE.filter(t => t.mes === m), 'despesa'));
    const ativo = i => !estado.mes || meses[i] === estado.mes;
    const limao = css('--limao'), coral = css('--coral');
    const barra = cor => ({ backgroundColor: ctx => ativo(ctx.dataIndex) ? cor : cor + '40', borderRadius: 4, maxBarThickness: 44, categoryPercentage: .7, barPercentage: .9 });

    desenhar('graficoMensal', {
      type: 'bar',
      data: {
        labels: meses.map(rotuloMes),
        datasets: [
          { label: 'Receitas', data: rec, ...barra(limao) },
          { label: 'Despesas', data: des, ...barra(coral) },
        ],
      },
      options: {
        layout: { padding: { top: 22 } },
        scales: {
          x: { grid: { display: false }, border: { color: css('--grade') } },
          y: { beginAtZero: true, grid: { color: css('--grade') }, border: { display: false }, ticks: { callback: v => moedaCurta(v), maxTicksLimit: 6 } },
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: { callbacks: {
            title: items => rotuloMesLongo(meses[items[0].dataIndex]),
            label: c => ` ${c.dataset.label}: ${moeda(c.parsed.y)}`,
            footer: items => `Saldo: ${moeda(rec[items[0].dataIndex] - des[items[0].dataIndex])}`,
          } },
          rotulos: { ativo: true, formato: v => moedaCurta(v), ocultarZero: true, tamanho: 11, cor: css('--texto-2') },
        },
        onClick: (_e, els) => {
          if (!els.length) return;
          const m = meses[els[0].index];
          estado.mes = estado.mes === m ? '' : m;
          sincronizarFiltros();
          render();
        },
        onHover: cursorMao,
      },
    });

    // Avisa quando o primeiro/último mês não está completo no extrato.
    if (BASE.length) {
      const primeiro = BASE[0].data, ultimo = BASE[BASE.length - 1].data;
      const incompletos = [];
      if (+primeiro.slice(8) > 1) incompletos.push(rotuloMes(primeiro.slice(0, 7)));
      const [a, m] = ultimo.slice(0, 7).split('-').map(Number);
      if (+ultimo.slice(8) < new Date(a, m, 0).getDate() && !incompletos.includes(rotuloMes(ultimo.slice(0, 7)))) incompletos.push(rotuloMes(ultimo.slice(0, 7)));
      $('subMensal').textContent = 'Clique em um mês para filtrar o painel.' +
        (incompletos.length ? ` Atenção: ${incompletos.join(' e ')} ${incompletos.length > 1 ? 'estão incompletos' : 'está incompleto'} no extrato.` : '');
    }

    $('tabelaMensal').innerHTML =
      '<thead><tr><th>Mês</th><th class="num">Receitas</th><th class="num">Despesas</th><th class="num">Saldo</th></tr></thead><tbody>' +
      meses.map((m, i) => `<tr><td>${rotuloMesLongo(m)}</td><td class="num">${moeda(rec[i])}</td><td class="num">${moeda(des[i])}</td><td class="num">${moeda(rec[i] - des[i])}</td></tr>`).join('') +
      '</tbody>';
  }

  function renderMedidor(lista) {
    const receitas = somar(lista, 'receita');
    const despesas = somar(lista, 'despesa');
    const p = receitas > 0 ? despesas / receitas : (despesas > 0 ? 1 : 0);
    const preenchido = Math.min(p, 1);
    const estourou = p > 1;
    desenhar('graficoMedidor', {
      type: 'doughnut',
      data: { datasets: [{
        data: [preenchido, 1 - preenchido],
        backgroundColor: [estourou ? css('--coral') : css('--limao'), css('--verde-medio')],
        borderColor: css('--cartao'), borderWidth: 2, borderRadius: 4,
      }] },
      options: {
        rotation: -90, circumference: 180, cutout: '62%',
        layout: { padding: { left: 8, right: 8, bottom: 40 } },
        plugins: { tooltip: { enabled: false } },
        events: [],
      },
    });
    $('medidorPct').textContent = receitas > 0 ? pct.format(p) : '—';
    $('medidorPct').className = estourou ? 'delta-ruim' : '';
    $('medidorNota').textContent = receitas > 0
      ? `${moeda(despesas)} gastos de ${moeda(receitas)} recebidos${estourou ? ' — gastou mais do que recebeu' : ''}`
      : 'sem receitas no período';
  }

  function renderCategorias(lista) {
    const grupos = agrupar(lista.filter(t => t.natureza === 'despesa'), t => t.categoria).filter(g => g.total > 0.005);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    const estreito = $('caixaCategorias').clientWidth < 520;
    $('subCategorias').textContent = estado.mes ? rotuloMesLongo(estado.mes) : 'todos os meses';
    $('caixaCategorias').style.height = Math.max(160, grupos.length * 34 + 30) + 'px';
    const limao = css('--limao');
    desenhar('graficoCategorias', {
      type: 'bar',
      data: {
        labels: grupos.map(g => g.chave),
        datasets: [{
          label: 'Gastos', data: grupos.map(g => g.total),
          backgroundColor: ctx => !estado.categoria || grupos[ctx.dataIndex]?.chave === estado.categoria ? limao : limao + '40',
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
            afterLabel: c => `${grupos[c.dataIndex].qtd} transações`,
          } },
          rotulos: { ativo: true, formato: v => estreito ? moedaCurta(v) : `${moeda(v)}  ${pct.format(v / total)}`, cor: css('--texto-2') },
        },
        onClick: (_e, els) => {
          if (!els.length) return;
          const c = grupos[els[0].index].chave;
          estado.categoria = estado.categoria === c ? '' : c;
          sincronizarFiltros();
          render();
          if (estado.categoria) $('corpoTransacoes').closest('.cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        onHover: cursorMao,
      },
    });
  }

  function renderFixas(lista) {
    const desp = lista.filter(t => t.natureza === 'despesa');
    const fixas = desp.filter(t => FIXAS.includes(t.categoria)).reduce((s, t) => s + t.contrib, 0);
    const variaveis = desp.filter(t => !FIXAS.includes(t.categoria)).reduce((s, t) => s + t.contrib, 0);
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

  function renderOnde(lista) {
    const grupos = agrupar(lista.filter(t => t.natureza === 'despesa'), t => t.nome).filter(g => g.total > 0.005).slice(0, 10);
    const max = grupos.length ? grupos[0].total : 0;
    $('listaOnde').innerHTML = grupos.length ? grupos.map(g => `
      <li>
        <span class="r-nome" title="${escapar(g.chave)}">${escapar(g.chave)}</span>
        <span class="r-valor">${moeda(g.total)}</span>
        <span class="r-barra"><i style="width:${(g.total / max * 100).toFixed(1)}%"></i></span>
        <span class="r-meta">${escapar(g.itens[0].categoria)} · ${g.qtd} ${g.qtd > 1 ? 'transações' : 'transação'}</span>
      </li>`).join('') : '<li class="vazio">Sem gastos no período.</li>';
  }

  function renderReceita(lista) {
    let grupos = agrupar(lista.filter(t => t.natureza === 'receita'), t => t.nome).filter(g => g.total > 0.005);
    if (grupos.length > 6) {
      const resto = grupos.slice(5);
      grupos = grupos.slice(0, 5).concat([{ chave: `Outras (${resto.length})`, total: resto.reduce((s, g) => s + g.total, 0), qtd: resto.reduce((s, g) => s + g.qtd, 0) }]);
    }
    // Em telas estreitas as barras ficam deitadas, para os nomes caberem.
    const caixa = $('graficoReceita').parentElement;
    const deitado = caixa.clientWidth < 520;
    caixa.style.height = deitado ? Math.max(140, grupos.length * 40 + 20) + 'px' : '';
    const quebrar = nome => {
      const linhas = [];
      let linha = '';
      for (const p of nome.split(/\s+/)) {
        if ((linha + ' ' + p).trim().length > 14 && linha) { linhas.push(linha); linha = p; } else linha = (linha + ' ' + p).trim();
      }
      if (linha) linhas.push(linha);
      return linhas.slice(0, 2).map(l => encurtar(l, 16));
    };
    desenhar('graficoReceita', {
      type: 'bar',
      data: {
        labels: grupos.map(g => deitado ? encurtar(g.chave, 18) : quebrar(g.chave)),
        datasets: [{ label: 'Receitas', data: grupos.map(g => g.total), backgroundColor: css('--limao'), borderRadius: 4, maxBarThickness: deitado ? 22 : 64, categoryPercentage: .8 }],
      },
      options: {
        indexAxis: deitado ? 'y' : 'x',
        layout: { padding: deitado ? { right: 64 } : { top: 24 } },
        scales: deitado
          ? { y: { grid: { display: false }, border: { display: false }, ticks: { color: css('--texto'), font: { size: 12 } } }, x: { display: false, beginAtZero: true } }
          : { x: { grid: { display: false }, border: { color: css('--grade') }, ticks: { color: css('--texto'), autoSkip: false, maxRotation: 0, font: { size: 11 } } }, y: { display: false, beginAtZero: true } },
        plugins: {
          tooltip: { callbacks: { title: items => grupos[items[0].dataIndex].chave, label: c => ` ${moeda(deitado ? c.parsed.x : c.parsed.y)} · ${grupos[c.dataIndex].qtd} entradas` } },
          rotulos: { ativo: true, formato: v => moedaCurta(v), cor: css('--texto') },
        },
      },
    });
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
        <td class="cat">${escapar(t.categoria)}${t.natureza === 'neutra' ? '<span class="tag-neutra" title="Não entra no total de receitas nem de despesas">não conta</span>' : ''}</td>
        <td class="num ${t.valor > 0 ? 'valor-pos' : ''}">${moeda(t.valor)}</td>
      </tr>`).join('') : '<tr><td colspan="4" class="vazio">Nenhuma transação encontrada.</td></tr>';

    const filtros = [estado.mes && rotuloMesLongo(estado.mes), estado.categoria, estado.busca && `"${estado.busca}"`].filter(Boolean);
    $('subTransacoes').textContent = filtros.length ? `Filtro: ${filtros.join(' · ')}` : 'Todas as transações';
    $('rodapeTabela').textContent = `${linhas.length} transações · soma ${moeda(linhas.reduce((s, t) => s + t.valor, 0))}`;
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
        renderTabela(estado.mes ? BASE.filter(t => t.mes === estado.mes) : BASE);
      }, 150);
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
