/* Painel "Minhas Finanças" — carrega os dados, calcula os totais e desenha os gráficos. */
(function () {
  'use strict';

  const CHAVE_ARMAZENAMENTO = 'financas.v1';
  const ARQUIVO_CIFRADO = 'dados/financas.cifrado.json';
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

  const estado = {
    transacoes: [],
    regras: {},          // correções manuais: chave do nome -> categoria
    fonte: 'exemplo',
    assinatura: null,    // identifica qual arquivo cifrado originou os dados
    armazenamento: null, // localStorage | sessionStorage | null
    mes: '',
    categoria: '',
    busca: '',
    cifradoPendente: null,
  };

  const graficos = {};

  // ======================================================================
  // Carregamento
  // ======================================================================
  function lerArmazenado() {
    for (const st of [localStorage, sessionStorage]) {
      try {
        const bruto = st.getItem(CHAVE_ARMAZENAMENTO);
        if (bruto) return { dados: JSON.parse(bruto), st };
      } catch (e) { /* armazenamento indisponível */ }
    }
    return null;
  }

  function salvar() {
    if (!estado.armazenamento) return;
    try {
      estado.armazenamento.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({
        transacoes: estado.transacoes, regras: estado.regras,
        fonte: estado.fonte, assinatura: estado.assinatura,
      }));
    } catch (e) { console.warn('Não foi possível salvar no navegador:', e); }
  }

  function aplicarDados(transacoes, regras, fonte) {
    estado.transacoes = transacoes;
    estado.regras = { ...(regras || {}) };
    estado.fonte = fonte;
  }

  async function buscarCifrado() {
    try {
      const r = await fetch(ARQUIVO_CIFRADO, { cache: 'no-cache' });
      if (!r.ok) return null;
      const obj = await r.json();
      return obj && obj.formato === 'financas-cifrado' ? obj : null;
    } catch (e) { return null; }
  }

  async function iniciar() {
    configurarGraficos();
    ligarEventos();

    const salvo = lerArmazenado();

    // 1) Arquivo local na pasta privado/ (só existe no seu computador)
    if (window.DADOS_LOCAIS) {
      let transacoes = [];
      for (const arq of window.DADOS_LOCAIS.arquivos || []) {
        const r = Importar.importarTexto(arq.conteudo, arq.nome);
        if (r.transacoes) transacoes = Importar.mesclar(transacoes, r.transacoes).transacoes;
      }
      let regras = { ...(window.DADOS_LOCAIS.regras || {}) };
      if (salvo) {
        transacoes = Importar.mesclar(transacoes, salvo.dados.transacoes || []).transacoes;
        regras = { ...regras, ...(salvo.dados.regras || {}) };
      }
      aplicarDados(transacoes, regras, 'local');
      estado.armazenamento = localStorage;
      return render();
    }

    // 2) Arquivo cifrado publicado no repositório
    const cifrado = await buscarCifrado();
    if (cifrado) {
      const assinatura = cifrado.dados.slice(0, 40);
      if (salvo && salvo.dados.assinatura === assinatura) {
        aplicarDados(salvo.dados.transacoes, salvo.dados.regras, 'cifrado');
        estado.assinatura = assinatura;
        estado.armazenamento = salvo.st;
        return render();
      }
      estado.cifradoPendente = { arquivo: cifrado, assinatura, mesclarCom: salvo ? salvo.dados : null };
      carregarExemplo(false);
      return pedirSenha();
    }

    // 3) Dados importados anteriormente neste navegador
    if (salvo && salvo.dados.transacoes && salvo.dados.transacoes.length) {
      aplicarDados(salvo.dados.transacoes, salvo.dados.regras, salvo.dados.fonte || 'navegador');
      estado.armazenamento = salvo.st;
      return render();
    }

    // 4) Exemplo
    carregarExemplo(true);
  }

  function carregarExemplo(renderizar = true) {
    aplicarDados(Exemplo.gerar(), {}, 'exemplo');
    estado.armazenamento = null;
    if (renderizar) render();
  }

  function pedirSenha() {
    $('erroSenha').hidden = true;
    $('inputSenha').value = '';
    render();
    $('dlgSenha').showModal();
    $('inputSenha').focus();
  }

  async function desbloquear(e) {
    e.preventDefault();
    const p = estado.cifradoPendente;
    if (!p) return $('dlgSenha').close();
    const botao = e.submitter || $('formSenha').querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Abrindo…';
    try {
      const dados = await Cripto.decifrar(p.arquivo, $('inputSenha').value);
      let transacoes = dados.transacoes || [];
      let regras = dados.regras || {};
      if (p.mesclarCom) {
        transacoes = Importar.mesclar(transacoes, p.mesclarCom.transacoes || []).transacoes;
        regras = { ...regras, ...(p.mesclarCom.regras || {}) };
      }
      aplicarDados(transacoes, regras, 'cifrado');
      estado.assinatura = p.assinatura;
      estado.armazenamento = $('chkLembrar').checked ? localStorage : sessionStorage;
      try { (estado.armazenamento === localStorage ? sessionStorage : localStorage).removeItem(CHAVE_ARMAZENAMENTO); } catch (_) {}
      estado.cifradoPendente = null;
      estado.mes = '';
      salvar();
      $('dlgSenha').close();
      render();
    } catch (err) {
      $('erroSenha').hidden = false;
      $('inputSenha').select();
    } finally {
      botao.disabled = false;
      botao.textContent = 'Abrir';
    }
  }

  // ======================================================================
  // Cálculos
  // ======================================================================
  function enriquecer() {
    const temCartao = estado.transacoes.some(t => t.conta === 'cartao');
    return estado.transacoes.map(t => {
      const chave = Categorias.chave(t.nome);
      const cat = estado.regras[chave] || t.categoria || Categorias.categorizar(t.tipo, t.nome, t.valor);
      let natureza;
      if (Categorias.NEUTRAS.includes(cat) || (cat === Categorias.FATURA && temCartao)) natureza = 'neutra';
      else if (Categorias.RECEITAS.includes(cat)) natureza = 'receita';
      else natureza = 'despesa';
      // contribuição positiva: quanto soma em receitas ou em despesas (estornos reduzem)
      const contrib = natureza === 'despesa' ? -t.valor : natureza === 'receita' ? t.valor : 0;
      return { ...t, chave, cat, natureza, contrib, mes: t.data.slice(0, 7) };
    });
  }

  function listaMeses(lista) {
    if (!lista.length) return [];
    const ini = lista[0].mes, fim = lista[lista.length - 1].mes;
    const meses = [];
    let [a, m] = ini.split('-').map(Number);
    while (true) {
      const k = `${a}-${String(m).padStart(2, '0')}`;
      meses.push(k);
      if (k >= fim) break;
      if (++m > 12) { m = 1; a++; }
    }
    return meses;
  }

  function somar(lista, natureza) {
    return lista.filter(t => t.natureza === natureza).reduce((s, t) => s + t.contrib, 0);
  }

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

  // ======================================================================
  // Renderização
  // ======================================================================
  function render() {
    const todas = enriquecer().sort((a, b) => a.data.localeCompare(b.data));
    const meses = listaMeses(todas);
    if (estado.mes && !meses.includes(estado.mes)) estado.mes = '';
    const doPeriodo = estado.mes ? todas.filter(t => t.mes === estado.mes) : todas;

    renderTopo(todas, meses);
    renderKpis(todas, doPeriodo, meses);
    renderMensal(todas, meses);
    renderMedidor(doPeriodo);
    renderCategorias(doPeriodo);
    renderFixas(doPeriodo);
    renderOnde(doPeriodo);
    renderReceita(doPeriodo);
    renderTabela(doPeriodo);
  }

  function renderTopo(todas, meses) {
    const nomes = { exemplo: 'Dados de exemplo', local: 'Extrato local (pasta privado/)', navegador: 'Extrato importado neste navegador', cifrado: 'Dados cifrados do repositório' };
    const periodo = todas.length ? ` · ${dataBR(todas[0].data)} a ${dataBR(todas[todas.length - 1].data)}` : '';
    $('fonteDados').textContent = `${nomes[estado.fonte] || 'Dados'} · ${todas.length} transações${periodo}`;
    $('avisoExemplo').hidden = estado.fonte !== 'exemplo';

    const sel = $('selMes');
    sel.innerHTML = '<option value="">Todos os meses</option>' +
      meses.slice().reverse().map(m => `<option value="${m}">${rotuloMesLongo(m)}</option>`).join('');
    sel.value = estado.mes;

    const selCat = $('selCategoria');
    selCat.innerHTML = '<option value="">Todas</option>' + Categorias.TODAS.map(c => `<option>${escapar(c)}</option>`).join('');
    selCat.value = estado.categoria;
  }

  function renderKpis(todas, lista, meses) {
    const receitas = somar(lista, 'receita');
    const despesas = somar(lista, 'despesa');
    const saldo = receitas - despesas;
    $('kpiReceitas').textContent = moeda(receitas);
    $('kpiDespesas').textContent = moeda(despesas);
    $('kpiSaldo').textContent = moeda(saldo);
    $('kpiSaldo').className = 'kpi-valor ' + (saldo < 0 ? 'delta-ruim' : '');
    $('kpiReceitasNota').textContent = `${lista.filter(t => t.natureza === 'receita' && t.valor > 0).length} entradas`;

    if (estado.mes) {
      const outros = meses.filter(m => m !== estado.mes);
      if (outros.length) {
        const media = outros.reduce((s, m) => s + somar(todas.filter(t => t.mes === m), 'despesa'), 0) / outros.length;
        const dif = media ? despesas / media - 1 : 0;
        $('kpiDespesasNota').innerHTML = media
          ? `<span class="${dif > 0 ? 'delta-ruim' : 'delta-bom'}">${dif > 0 ? '▲' : '▼'} ${pct.format(Math.abs(dif))}</span> vs. média dos outros meses`
          : '';
      } else $('kpiDespesasNota').textContent = '';
      $('kpiSaldoNota').textContent = rotuloMesLongo(estado.mes);
    } else {
      $('kpiDespesasNota').textContent = meses.length ? `média de ${moeda(despesas / meses.length)} por mês` : '';
      $('kpiSaldoNota').textContent = 'receitas − despesas';
    }

    const inv = lista.filter(t => t.cat === 'Investimentos');
    const aplicado = -inv.filter(t => t.valor < 0).reduce((s, t) => s + t.valor, 0);
    const resgatado = inv.filter(t => t.valor > 0).reduce((s, t) => s + t.valor, 0);
    $('kpiInvestido').textContent = moeda(aplicado - resgatado);
    $('kpiInvestidoNota').textContent = inv.length ? `aplicado ${moedaCurta(aplicado)} · resgatado ${moedaCurta(resgatado)}` : 'nenhuma aplicação no período';
  }

  // ---------- gráficos ----------
  function configurarGraficos() {
    if (!window.Chart) return;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = css('--texto-2');
    Chart.defaults.borderColor = css('--grade');
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.display = false;
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: '#0e1513', borderColor: css('--borda'), borderWidth: 1,
      titleColor: css('--texto'), bodyColor: css('--texto-2'), padding: 10, cornerRadius: 8, displayColors: true, boxPadding: 4,
    });
    Chart.register(pluginRotulos);
  }

  // Desenha valores ao lado/em cima das barras e percentuais nas fatias.
  const pluginRotulos = {
    id: 'rotulos',
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.ativo) return;
      const { ctx } = chart;
      ctx.save();
      ctx.font = `${opts.peso || 400} ${opts.tamanho || 12}px ${Chart.defaults.font.family}`;
      ctx.fillStyle = opts.cor || css('--texto');
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((el, i) => {
          const v = ds.data[i];
          if (v == null || (opts.ocultarZero && !v)) return;
          const texto = opts.formato(v, i, ds);
          if (!texto) return;
          if (meta.type === 'pie' || meta.type === 'doughnut') {
            const p = el.tooltipPosition();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = (opts.corFatia && opts.corFatia(i)) || opts.cor || css('--texto');
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

  function desenhar(id, config) {
    if (!window.Chart) return;
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart($(id), config);
  }

  const eixoValores = { grid: { color: () => css('--grade') }, border: { display: false }, ticks: { callback: v => moedaCurta(v), maxTicksLimit: 6 } };
  const eixoCategorias = { grid: { display: false }, border: { color: () => css('--grade') } };

  function renderMensal(todas, meses) {
    const rec = meses.map(m => somar(todas.filter(t => t.mes === m), 'receita'));
    const des = meses.map(m => somar(todas.filter(t => t.mes === m), 'despesa'));
    const ativo = i => !estado.mes || meses[i] === estado.mes;
    const limao = css('--limao'), coral = css('--coral');
    const apagar = (cor) => cor + '40';

    desenhar('graficoMensal', {
      type: 'bar',
      data: {
        labels: meses.map(rotuloMes),
        datasets: [
          { label: 'Receitas', data: rec, backgroundColor: ctx => ativo(ctx.dataIndex) ? limao : apagar(limao), borderRadius: 4, maxBarThickness: 44, categoryPercentage: .7, barPercentage: .9 },
          { label: 'Despesas', data: des, backgroundColor: ctx => ativo(ctx.dataIndex) ? coral : apagar(coral), borderRadius: 4, maxBarThickness: 44, categoryPercentage: .7, barPercentage: .9 },
        ],
      },
      options: {
        layout: { padding: { top: 22 } },
        scales: { x: eixoCategorias, y: { ...eixoValores, beginAtZero: true } },
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
          render();
        },
        onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
      },
    });

    // nota de meses incompletos
    if (todas.length) {
      const primeiro = todas[0].data, ultimo = todas[todas.length - 1].data;
      const incompletos = [];
      if (+primeiro.slice(8) > 1) incompletos.push(rotuloMes(primeiro.slice(0, 7)));
      const [a, m] = ultimo.slice(0, 7).split('-').map(Number);
      const ultimoDia = new Date(a, m, 0).getDate();
      if (+ultimo.slice(8) < ultimoDia && !incompletos.includes(rotuloMes(ultimo.slice(0, 7)))) incompletos.push(rotuloMes(ultimo.slice(0, 7)));
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
    const grupos = agrupar(lista.filter(t => t.natureza === 'despesa'), t => t.cat).filter(g => g.total > 0.005);
    const total = grupos.reduce((s, g) => s + g.total, 0);
    const estreito = $('caixaCategorias').clientWidth < 520;
    const encurtar = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
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
          render();
          if (estado.categoria) $('corpoTransacoes').closest('.cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
      },
    });
  }

  function renderFixas(lista) {
    const desp = lista.filter(t => t.natureza === 'despesa');
    const fixas = desp.filter(t => Categorias.FIXAS.includes(t.cat)).reduce((s, t) => s + t.contrib, 0);
    const variaveis = desp.filter(t => !Categorias.FIXAS.includes(t.cat)).reduce((s, t) => s + t.contrib, 0);
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
    $('notaFixas').textContent = `Fixas: ${Categorias.FIXAS.join(', ')}.`;
  }

  function renderOnde(lista) {
    const grupos = agrupar(lista.filter(t => t.natureza === 'despesa'), t => t.chave).filter(g => g.total > 0.005).slice(0, 10);
    const max = grupos.length ? grupos[0].total : 0;
    $('listaOnde').innerHTML = grupos.length ? grupos.map(g => {
      const nome = g.itens[0].nome;
      return `<li>
        <span class="r-nome" title="${escapar(nome)}">${escapar(nome)}</span>
        <span class="r-valor">${moeda(g.total)}</span>
        <span class="r-barra"><i style="width:${(g.total / max * 100).toFixed(1)}%"></i></span>
        <span class="r-meta">${escapar(g.itens[0].cat)} · ${g.qtd} ${g.qtd > 1 ? 'transações' : 'transação'}</span>
      </li>`;
    }).join('') : '<li class="vazio">Sem gastos no período.</li>';
  }

  function renderReceita(lista) {
    let grupos = agrupar(lista.filter(t => t.natureza === 'receita'), t => t.chave).filter(g => g.total > 0.005);
    if (grupos.length > 6) {
      const resto = grupos.slice(5);
      grupos = grupos.slice(0, 5).concat([{ chave: '_outros', total: resto.reduce((s, g) => s + g.total, 0), qtd: resto.reduce((s, g) => s + g.qtd, 0), itens: [{ nome: `Outras (${resto.length})` }] }]);
    }
    const rotulo = nome => {
      const palavras = String(nome).replace(/\b(ltda|s\.?a\.?|me|eireli|epp)\b\.?/gi, '').trim().split(/\s+/);
      const linhas = [];
      let linha = '';
      for (const p of palavras) {
        if ((linha + ' ' + p).trim().length > 14 && linha) { linhas.push(linha); linha = p; } else linha = (linha + ' ' + p).trim();
        if (linhas.length === 2) break;
      }
      if (linha && linhas.length < 2) linhas.push(linha);
      return linhas.map(l => l.length > 16 ? l.slice(0, 15) + '…' : l);
    };
    // Em telas estreitas as barras ficam deitadas, para os nomes caberem.
    const deitado = $('graficoReceita').parentElement.clientWidth < 520;
    const caixa = $('graficoReceita').parentElement;
    caixa.style.height = deitado ? Math.max(140, grupos.length * 40 + 20) + 'px' : '';
    const nomeCurto = nome => { const s = String(nome).replace(/\b(ltda|s\.?a\.?|me|eireli|epp)\b\.?/gi, '').trim(); return s.length > 18 ? s.slice(0, 17) + '…' : s; };
    desenhar('graficoReceita', {
      type: 'bar',
      data: {
        labels: grupos.map(g => deitado ? nomeCurto(g.itens[0].nome) : rotulo(g.itens[0].nome)),
        datasets: [{ label: 'Receitas', data: grupos.map(g => g.total), backgroundColor: css('--limao'), borderRadius: 4, maxBarThickness: deitado ? 22 : 64, categoryPercentage: .8 }],
      },
      options: {
        indexAxis: deitado ? 'y' : 'x',
        layout: { padding: deitado ? { right: 64 } : { top: 24 } },
        scales: deitado
          ? { y: { grid: { display: false }, border: { display: false }, ticks: { color: css('--texto'), font: { size: 12 } } }, x: { display: false, beginAtZero: true } }
          : { x: { ...eixoCategorias, ticks: { color: css('--texto'), autoSkip: false, maxRotation: 0, font: { size: 11 } } }, y: { display: false, beginAtZero: true } },
        plugins: {
          tooltip: { callbacks: { title: items => grupos[items[0].dataIndex].itens[0].nome, label: c => ` ${moeda(deitado ? c.parsed.x : c.parsed.y)} · ${grupos[c.dataIndex].qtd} entradas` } },
          rotulos: { ativo: true, formato: v => moedaCurta(v), cor: css('--texto') },
        },
      },
    });
  }

  function renderTabela(lista) {
    const busca = Categorias.normalizar(estado.busca).trim();
    let linhas = lista.slice().sort((a, b) => b.data.localeCompare(a.data) || a.valor - b.valor);
    if (estado.categoria) linhas = linhas.filter(t => t.cat === estado.categoria);
    if (busca) linhas = linhas.filter(t => Categorias.normalizar(`${t.nome} ${t.tipo} ${t.descricao}`).includes(busca));

    const opcoes = Categorias.TODAS.map(c => `<option>${escapar(c)}</option>`).join('');
    const LIMITE = 400;
    $('corpoTransacoes').innerHTML = linhas.length ? linhas.slice(0, LIMITE).map(t => `
      <tr>
        <td class="data">${dataBR(t.data).slice(0, 5)}<span class="ano">${dataBR(t.data).slice(5)}</span></td>
        <td class="desc">${escapar(t.nome)}<small>${escapar(t.tipo || (t.conta === 'cartao' ? 'Cartão de crédito' : ''))}</small></td>
        <td><select data-chave="${escapar(t.chave)}" aria-label="Categoria de ${escapar(t.nome)}">${opcoes.replace(`<option>${escapar(t.cat)}</option>`, `<option selected>${escapar(t.cat)}</option>`)}</select>${t.natureza === 'neutra' ? '<span class="tag-neutra" title="Não entra no total de receitas nem de despesas">não conta</span>' : ''}</td>
        <td class="num ${t.valor > 0 ? 'valor-pos' : ''}">${moeda(t.valor)}</td>
      </tr>`).join('') : '<tr><td colspan="4" class="vazio">Nenhuma transação encontrada.</td></tr>';

    const filtros = [estado.mes && rotuloMesLongo(estado.mes), estado.categoria, estado.busca && `"${estado.busca}"`].filter(Boolean);
    $('subTransacoes').textContent = filtros.length ? `Filtro: ${filtros.join(' · ')}` : 'Todas as transações';
    const soma = linhas.reduce((s, t) => s + t.valor, 0);
    $('rodapeTabela').textContent = `${linhas.length} transações · soma ${moeda(soma)}` + (linhas.length > LIMITE ? ` · mostrando as ${LIMITE} mais recentes` : '');
  }

  // ======================================================================
  // Eventos
  // ======================================================================
  function toast(msg, ms = 3500) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { el.hidden = true; }, ms);
  }

  function baixar(nome, conteudo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importarArquivos(arquivos) {
    if (estado.fonte === 'exemplo') aplicarDados([], {}, 'navegador');
    let novas = 0, erros = [];
    for (const arq of arquivos) {
      try {
        const r = Importar.importarTexto(await arq.text(), arq.name);
        if (r.cifrado) {
          estado.cifradoPendente = { arquivo: r.cifrado, assinatura: r.cifrado.dados.slice(0, 40), mesclarCom: { transacoes: estado.transacoes, regras: estado.regras } };
          pedirSenha();
          continue;
        }
        const m = Importar.mesclar(estado.transacoes, r.transacoes);
        estado.transacoes = m.transacoes;
        novas += m.adicionadas;
        if (r.regras) estado.regras = { ...r.regras, ...estado.regras };
      } catch (e) {
        erros.push(`${arq.name}: ${e.message}`);
      }
    }
    if (!estado.transacoes.length) carregarExemplo(false);
    if (!estado.armazenamento && estado.fonte !== 'exemplo') estado.armazenamento = localStorage;
    salvar();
    render();
    if (erros.length) toast('Erro: ' + erros.join(' | '), 7000);
    else if (arquivos.length) toast(novas ? `${novas} transações novas importadas.` : 'Nenhuma transação nova (já estavam importadas).');
  }

  function ligarEventos() {
    $('selMes').addEventListener('change', e => { estado.mes = e.target.value; render(); });
    $('selCategoria').addEventListener('change', e => { estado.categoria = e.target.value; render(); });
    let espera;
    $('inputBusca').addEventListener('input', e => {
      clearTimeout(espera);
      espera = setTimeout(() => { estado.busca = e.target.value; renderTabela((estado.mes ? enriquecer().filter(t => t.mes === estado.mes) : enriquecer())); }, 150);
    });

    $('corpoTransacoes').addEventListener('change', e => {
      const sel = e.target.closest('select[data-chave]');
      if (!sel) return;
      estado.regras[sel.dataset.chave] = sel.value;
      salvar();
      render();
      toast(estado.fonte === 'exemplo' ? 'Categoria alterada (só nesta visualização de exemplo).'
        : estado.fonte === 'cifrado' ? 'Categoria alterada neste navegador. Exporte de novo os dados cifrados para levar a correção ao site publicado.'
        : 'Categoria alterada para todas as transações deste nome.');
    });

    $('btnImportar').addEventListener('click', () => $('inputArquivo').click());
    $('inputArquivo').addEventListener('change', e => { importarArquivos([...e.target.files]); e.target.value = ''; });
    // arrastar e soltar arquivo na página
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) importarArquivos([...e.dataTransfer.files]); });

    $('formSenha').addEventListener('submit', desbloquear);
    $('btnVerExemplo').addEventListener('click', () => { $('dlgSenha').close(); carregarExemplo(true); });

    const fecharMenu = () => document.querySelector('.menu').removeAttribute('open');
    $('btnExportarCifrado').addEventListener('click', () => {
      fecharMenu();
      if (estado.fonte === 'exemplo') return toast('Importe seu extrato antes de exportar.');
      if (!Cripto.disponivel) return toast('Este navegador não suporta criptografia aqui (abra pelo endereço https ou localhost).', 6000);
      $('erroExportar').hidden = true;
      $('formExportar').reset();
      $('dlgExportar').showModal();
    });
    $('btnCancelarExportar').addEventListener('click', () => $('dlgExportar').close());
    $('formExportar').addEventListener('submit', async e => {
      e.preventDefault();
      const s1 = $('inputNovaSenha').value, s2 = $('inputNovaSenha2').value;
      const erro = msg => { $('erroExportar').textContent = msg; $('erroExportar').hidden = false; };
      if (s1.length < 10) return erro('Use pelo menos 10 caracteres.');
      if (s1 !== s2) return erro('As senhas não conferem.');
      const arquivo = await Cripto.cifrar({ versao: 1, transacoes: estado.transacoes, regras: estado.regras }, s1);
      baixar('financas.cifrado.json', JSON.stringify(arquivo));
      $('dlgExportar').close();
      toast('Arquivo gerado. Coloque-o em dados/financas.cifrado.json no repositório.', 6000);
    });

    $('btnBaixarJson').addEventListener('click', () => {
      fecharMenu();
      if (estado.fonte === 'exemplo') return toast('Importe seu extrato antes de exportar.');
      if (!confirm('Este arquivo NÃO é cifrado: qualquer pessoa com ele vê suas transações. Não suba no GitHub público. Continuar?')) return;
      baixar('financas-backup.json', JSON.stringify({ versao: 1, transacoes: estado.transacoes, regras: estado.regras }, null, 1));
    });

    $('btnLimpar').addEventListener('click', () => {
      fecharMenu();
      if (!confirm('Apagar os dados e correções de categoria salvos neste navegador?')) return;
      try { localStorage.removeItem(CHAVE_ARMAZENAMENTO); sessionStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch (_) {}
      location.reload();
    });

    // Ao mudar de largura (girar o celular etc.) redesenha para ajustar os rótulos.
    let larguraAnterior = innerWidth, esperaResize;
    addEventListener('resize', () => {
      clearTimeout(esperaResize);
      esperaResize = setTimeout(() => {
        if (Math.abs(innerWidth - larguraAnterior) > 40) { larguraAnterior = innerWidth; render(); }
      }, 250);
    });

    document.addEventListener('click', e => {
      const menu = document.querySelector('.menu');
      if (menu.open && !menu.contains(e.target)) menu.removeAttribute('open');
    });
  }

  iniciar();
})();
