/*
 * Leitura de extratos: CSV (Nubank conta, Nubank cartão e formatos genéricos),
 * OFX e o JSON de backup do próprio site. Tudo roda no navegador.
 *
 * Formato interno de cada transação:
 *   { id, data: 'AAAA-MM-DD', valor: número (negativo = saída),
 *     tipo, nome, descricao, conta: 'conta' | 'cartao' }
 */
(function () {
  'use strict';

  // ---------- utilidades ----------
  function semAcento(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function hash(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function lerData(s) {
    s = String(s || '').trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
    if (m) {
      let ano = m[3].length === 2 ? '20' + m[3] : m[3];
      return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    m = s.match(/^(\d{4})(\d{2})(\d{2})/); // OFX: 20260907000000
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return null;
  }

  function lerValor(s) {
    if (typeof s === 'number') return s;
    let t = String(s || '').trim();
    if (!t) return NaN;
    let sinal = 1;
    if (/\bD$/i.test(t) || /^\(.*\)$/.test(t)) sinal = -1; // "123,45 D" ou "(123,45)"
    t = t.replace(/[R$\s()DCdc]/g, '');
    if (t.startsWith('-')) { sinal *= -1; t = t.slice(1); }
    if (t.includes(',') && t.includes('.')) {
      // decide qual é o separador decimal pelo último que aparece
      t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    } else if (t.includes(',')) {
      t = t.replace(',', '.');
    }
    const n = parseFloat(t);
    return isNaN(n) ? NaN : sinal * n;
  }

  // Separa "Transferência enviada pelo Pix - FULANO - 123.456... - BANCO ..." em tipo + nome.
  function separarDescricao(desc) {
    const partes = String(desc || '').split(' - ').map(p => p.trim()).filter(Boolean);
    if (partes.length <= 1) return { tipo: '', nome: limparNome(partes[0] || desc || '') };
    return { tipo: partes[0], nome: limparNome(partes[1]) };
  }

  function limparNome(nome) {
    return String(nome || '')
      .replace(/^\d{2}\.\d{3}\.\d{3}\s+/, '') // CNPJ raiz de MEI no começo do nome
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ---------- CSV ----------
  function parseCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    const primeira = texto.split(/\r?\n/, 1)[0];
    const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';'
      : (primeira.includes('\t') ? '\t' : ',');
    const linhas = [];
    let campo = '', linha = [], aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (aspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
        } else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === sep) { linha.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        linha.push(campo); campo = '';
        if (linha.some(x => x.trim() !== '')) linhas.push(linha);
        linha = [];
      } else campo += c;
    }
    linha.push(campo);
    if (linha.some(x => x.trim() !== '')) linhas.push(linha);
    return linhas;
  }

  const COLUNAS = {
    data: ['data', 'date', 'data lancamento', 'data de lancamento', 'data movimento', 'dt lancamento', 'data da transacao'],
    valor: ['valor', 'amount', 'valor (r$)', 'valor r$', 'quantia', 'montante'],
    desc: ['descricao', 'title', 'historico', 'lancamento', 'estabelecimento', 'description', 'memo', 'detalhes'],
    id: ['identificador', 'id', 'fitid', 'codigo'],
    credito: ['credito', 'entrada', 'entradas', 'credito (r$)'],
    debito: ['debito', 'saida', 'saidas', 'debito (r$)'],
  };

  function achaColuna(cabecalho, nomes) {
    for (const n of nomes) {
      const i = cabecalho.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  }

  function importarCSV(texto, nomeArquivo) {
    const linhas = parseCSV(texto);
    // procura a linha de cabeçalho (alguns bancos colocam linhas de título antes)
    let iCab = linhas.findIndex(l => {
      const c = l.map(semAcento);
      return achaColuna(c, COLUNAS.data) >= 0 && (achaColuna(c, COLUNAS.valor) >= 0 || achaColuna(c, COLUNAS.credito) >= 0);
    });
    if (iCab < 0) throw new Error(`Não reconheci as colunas de "${nomeArquivo}". Preciso de pelo menos Data e Valor.`);
    const cab = linhas[iCab].map(semAcento);
    const col = {};
    for (const k of Object.keys(COLUNAS)) col[k] = achaColuna(cab, COLUNAS[k]);

    // Fatura de cartão Nubank: date,title,amount (positivo = compra)
    const ehCartao = cab.includes('title') && cab.includes('amount') ||
      /fatura|cartao|credit/i.test(semAcento(nomeArquivo || ''));

    const saida = [];
    for (const l of linhas.slice(iCab + 1)) {
      const data = lerData(l[col.data]);
      if (!data) continue;
      let valor;
      if (col.valor >= 0) valor = lerValor(l[col.valor]);
      else valor = (lerValor(l[col.credito]) || 0) - Math.abs(lerValor(l[col.debito]) || 0);
      if (isNaN(valor) || valor === 0) continue;
      if (ehCartao) valor = -valor;
      const descricao = (col.desc >= 0 ? l[col.desc] : '').trim();
      const partes = ehCartao ? { tipo: 'Cartão de crédito', nome: limparNome(descricao) } : separarDescricao(descricao);
      saida.push({
        idOrigem: col.id >= 0 ? (l[col.id] || '').trim() : '',
        data, valor: Math.round(valor * 100) / 100, descricao,
        tipo: partes.tipo, nome: partes.nome || descricao,
        conta: ehCartao ? 'cartao' : 'conta',
      });
    }
    return finalizar(saida);
  }

  // ---------- OFX ----------
  function importarOFX(texto) {
    const blocos = texto.split(/<STMTTRN>/i).slice(1);
    const tag = (b, t) => {
      const m = b.match(new RegExp('<' + t + '>([^<\\r\\n]*)', 'i'));
      return m ? m[1].trim() : '';
    };
    const ehCartao = /<CCSTMTRS>/i.test(texto);
    const saida = [];
    for (const b of blocos) {
      const data = lerData(tag(b, 'DTPOSTED'));
      const valor = lerValor(tag(b, 'TRNAMT').replace(',', '.'));
      if (!data || isNaN(valor) || valor === 0) continue;
      const descricao = decodificarEntidades(tag(b, 'MEMO') || tag(b, 'NAME'));
      const partes = ehCartao ? { tipo: 'Cartão de crédito', nome: limparNome(descricao) } : separarDescricao(descricao);
      saida.push({
        idOrigem: tag(b, 'FITID'), data, valor: Math.round(valor * 100) / 100, descricao,
        tipo: partes.tipo, nome: partes.nome || descricao, conta: ehCartao ? 'cartao' : 'conta',
      });
    }
    if (!saida.length) throw new Error('Não encontrei transações no arquivo OFX.');
    return finalizar(saida);
  }

  function decodificarEntidades(s) {
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  // ---------- IDs e mesclagem ----------
  function finalizar(lista) {
    const vistos = {};
    return lista.map(t => {
      let id = t.idOrigem;
      if (!id) {
        const base = `${t.data}|${t.valor}|${t.descricao}`;
        vistos[base] = (vistos[base] || 0) + 1; // transações idênticas no mesmo dia
        id = 'h' + hash(base + '|' + vistos[base]);
      }
      const { idOrigem, ...resto } = t;
      return { id, ...resto };
    });
  }

  function mesclar(existentes, novas) {
    const mapa = new Map(existentes.map(t => [t.id, t]));
    let adicionadas = 0;
    for (const t of novas) {
      if (!mapa.has(t.id)) adicionadas++;
      mapa.set(t.id, { ...mapa.get(t.id), ...t });
    }
    const todas = [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
    return { transacoes: todas, adicionadas };
  }

  // Lê um arquivo (texto) e devolve { transacoes, regras? }
  function importarTexto(texto, nomeArquivo) {
    const n = (nomeArquivo || '').toLowerCase();
    const inicio = texto.trimStart().slice(0, 200);
    if (n.endsWith('.json') || inicio.startsWith('{')) {
      const obj = JSON.parse(texto);
      if (obj.formato === 'financas-cifrado') return { cifrado: obj };
      if (!Array.isArray(obj.transacoes)) throw new Error('JSON sem a lista "transacoes".');
      return { transacoes: obj.transacoes, regras: obj.regras || {} };
    }
    if (n.endsWith('.ofx') || /<OFX>/i.test(texto.slice(0, 2000))) return { transacoes: importarOFX(texto) };
    return { transacoes: importarCSV(texto, nomeArquivo) };
  }

  window.Importar = { importarTexto, mesclar, separarDescricao };
})();
