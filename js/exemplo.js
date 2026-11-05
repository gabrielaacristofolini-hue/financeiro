/* Dados fictícios para demonstrar o painel quando nenhum extrato foi carregado. */
(function () {
  'use strict';

  function gerar() {
    let semente = 42;
    const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    const hoje = new Date();
    const lista = [];
    let n = 0;
    const add = (ano, mes, dia, valor, tipo, nome) => {
      const d = new Date(ano, mes, Math.min(dia, 28));
      if (d > hoje) return;
      const data = d.toISOString().slice(0, 10);
      lista.push({ id: 'ex' + (n++), data, valor: Math.round(valor * 100) / 100, tipo, nome, descricao: `${tipo} - ${nome}`, conta: 'conta' });
    };

    for (let k = 5; k >= 0; k--) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() - k, 1);
      const a = ref.getFullYear(), m = ref.getMonth();
      add(a, m, 5, 5200, 'Transferência recebida pelo Pix', 'EMPRESA EXEMPLO LTDA');
      if (rnd() > 0.6) add(a, m, 18, 600 + rnd() * 900, 'Transferência recebida pelo Pix', 'CLIENTE FREELA');
      add(a, m, 6, -1450, 'Pagamento de boleto efetuado', 'IMOBILIARIA MODELO');
      add(a, m, 8, -(180 + rnd() * 90), 'Pagamento de boleto efetuado', 'COMPANHIA DE ENERGIA');
      add(a, m, 10, -99.9, 'Transferência enviada pelo Pix', 'PROVEDOR TELECOM');
      add(a, m, 12, -(70 + rnd() * 40), 'Pagamento de boleto efetuado', 'AGUAS DE EXEMPLO');
      add(a, m, 3, -119.9, 'Compra no débito', 'ACADEMIA BOA FORMA');
      add(a, m, 15, -55.9, 'Compra no débito', 'NETFLIX.COM');
      add(a, m, 15, -21.9, 'Compra no débito', 'SPOTIFY');
      for (let i = 0; i < 9; i++) add(a, m, 1 + Math.floor(rnd() * 28), -(25 + rnd() * 180), 'Compra no débito', rnd() > .5 ? 'SUPERMERCADO CENTRAL' : 'MERCADINHO DO BAIRRO');
      for (let i = 0; i < 7; i++) add(a, m, 1 + Math.floor(rnd() * 28), -(22 + rnd() * 60), 'Transferência enviada pelo Pix', rnd() > .5 ? 'IFOOD.COM AGENCIA DE RESTAURANTES' : 'PADARIA PAO QUENTE');
      for (let i = 0; i < 5; i++) add(a, m, 1 + Math.floor(rnd() * 28), -(12 + rnd() * 30), 'Transferência enviada pelo Pix', 'UBER DO BRASIL');
      add(a, m, 20, -(150 + rnd() * 120), 'Compra no débito', 'POSTO SHELL');
      if (rnd() > .4) add(a, m, 22, -(40 + rnd() * 120), 'Compra no débito', 'DROGARIA SAUDE');
      if (rnd() > .5) add(a, m, 24, -(90 + rnd() * 300), 'Compra no débito', 'AMAZON MARKETPLACE');
      if (rnd() > .6) add(a, m, 26, -(60 + rnd() * 200), 'Compra no débito', 'CINEMA E BAR');
      add(a, m, 27, -800, 'Aplicação RDB', 'Aplicação RDB');
      for (let i = 0; i < 3; i++) add(a, m, 1 + Math.floor(rnd() * 28), -(10 + rnd() * 80), 'Transferência enviada pelo Pix', ['MARIA EXEMPLO', 'JOAO EXEMPLO', 'ANA EXEMPLO'][i]);
    }
    return lista.sort((x, y) => x.data.localeCompare(y.data));
  }

  window.Exemplo = { gerar };
})();
