/*
 * Banco de dados do painel. Mantido pelo Claude a partir dos extratos enviados no chat.
 *
 * Cada transação: data (AAAA-MM-DD), valor (negativo = saída), tipo, nome
 * (estabelecimento/pessoa, padronizado), categoria, obs (observação escrita no app
 * do banco, revisada e redigida com clareza) e, quando houver, nota (ligação com
 * outras transações).
 *
 * Categorias especiais (ver js/app.js): "Salário e renda" e "Recebimentos" são receitas;
 * "Investimentos" e "Transferência entre contas" não contam nem como receita nem como despesa.
 * Valor positivo numa categoria de despesa (troco, reembolso) abate o gasto daquela categoria.
 * Despesa sem destino identificável vai em "Outros".
 */
window.FINANCAS = {
  atualizadoEm: '2026-11-25',
  extratos: [
    { conta: 'Nubank (conta)', de: '2026-11-01', ate: '2026-11-25' },
  ],
  transacoes: [
    // ---------------- 01/11 ----------------
    { data: '2026-11-01', valor: -100.00, tipo: 'Pix enviado', nome: 'Laura Souza Silva', categoria: 'Lazer',
      obs: 'Devolução dos R$ 100 que peguei em dinheiro com a Laura e usei no churrasco.',
      nota: 'Churrasco: total de R$ 133, somando o Pix de R$ 33 para o Danilo (02/11).' },
    { data: '2026-11-01', valor: -20.00, tipo: 'Pix enviado', nome: 'M4 Produtos e Serviços', categoria: 'Outros',
      obs: 'Não lembro do que se trata.' },
    { data: '2026-11-01', valor: -12.00, tipo: 'Pix enviado', nome: 'Leonizio Azevedo Dias', categoria: 'Transporte',
      obs: 'Corrida de inDrive.' },
    { data: '2026-11-01', valor: -177.89, tipo: 'Débito', nome: 'Supermercados BH', categoria: 'Mercado' },
    { data: '2026-11-01', valor: -14.50, tipo: 'Pix enviado', nome: 'Guilherme Oliveira Silva Júnior', categoria: 'Transporte',
      obs: 'Corrida de inDrive.' },

    // ---------------- 02/11 ----------------
    { data: '2026-11-02', valor: -24.00, tipo: 'Pix enviado', nome: 'Marcelo Oliveira Santos', categoria: 'Transporte',
      obs: 'Corrida de inDrive ou Uber.' },
    { data: '2026-11-02', valor: -33.00, tipo: 'Pix enviado', nome: 'Danilo Nunes de Oliveira', categoria: 'Lazer',
      obs: 'Minha parte no churrasco: R$ 133 no total, sendo R$ 33 neste Pix e R$ 100 no dinheiro que peguei com a Laura.',
      nota: 'Churrasco: total de R$ 133, somando o Pix de R$ 100 para a Laura (01/11).' },
    { data: '2026-11-02', valor: -25.00, tipo: 'Pix enviado', nome: 'Eduardo Henrique da Silva Rozado', categoria: 'Transporte',
      obs: 'Corrida de aplicativo (Uber ou inDrive).' },

    // ---------------- 03/11 ----------------
    { data: '2026-11-03', valor: -300.00, tipo: 'Pix enviado', nome: 'Kakau (Ana Klara)', categoria: 'Outros',
      obs: 'Enviado à Kakau para a carteira de táxi e corridas de Uber; só uma pequena parte foi Uber.',
      nota: 'R$ 42,44 voltaram de troco em 04/11. Custo real: R$ 257,56.' },
    { data: '2026-11-03', valor: -17.00, tipo: 'Débito', nome: 'Nosso Gás e Água', categoria: 'Contas da casa',
      obs: 'Galão de água.' },
    { data: '2026-11-03', valor: -17.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 04/11 ----------------
    { data: '2026-11-04', valor: 42.44, tipo: 'Pix recebido', nome: 'Kakau (Ana Klara)', categoria: 'Outros',
      obs: 'Troco dos R$ 300 que enviei à Kakau no dia anterior.',
      nota: 'Abate o gasto em Outros; não é renda.' },
    { data: '2026-11-04', valor: -78.05, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação',
      obs: 'Pedido de Burger King pelo 99 Food.' },

    // ---------------- 05/11 ----------------
    { data: '2026-11-05', valor: 3600.00, tipo: 'Pix recebido', nome: 'JN Content Mídia Digital', categoria: 'Salário e renda',
      obs: 'Salário.' },
    { data: '2026-11-05', valor: -1031.90, tipo: 'Boleto', nome: 'Certa Imóveis', categoria: 'Moradia',
      obs: 'Aluguel.' },
    { data: '2026-11-05', valor: -437.82, tipo: 'Boleto', nome: 'Bulbe Energia', categoria: 'Contas da casa',
      obs: 'Conta de energia elétrica.' },
    { data: '2026-11-05', valor: -53.00, tipo: 'Pix enviado', nome: 'Marcio Rogério Higino', categoria: 'Alimentação',
      obs: 'Lanche.' },

    // ---------------- 06/11 ----------------
    { data: '2026-11-06', valor: -44.77, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado',
      obs: 'Compras de mercado, verduras e ração.' },
    { data: '2026-11-06', valor: -99.90, tipo: 'Pix enviado', nome: 'IBI Telecom', categoria: 'Contas da casa',
      obs: 'Conta de internet.' },
    { data: '2026-11-06', valor: -407.81, tipo: 'Boleto', nome: 'Fatura Nubank', categoria: 'Fatura do cartão',
      obs: 'Pagamento do cartão de crédito.' },
    { data: '2026-11-06', valor: -29.29, tipo: 'Boleto', nome: 'Fatura Nubank', categoria: 'Fatura do cartão',
      obs: 'Pagamento do cartão de crédito.' },
    { data: '2026-11-06', valor: -12.00, tipo: 'Débito', nome: 'Carlos Cuba (Mercado Pago)', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },
    { data: '2026-11-06', valor: -6.00, tipo: 'Débito', nome: 'Shopping Gov. Valadares', categoria: 'Alimentação',
      obs: 'Sorvete no shopping.' },
    { data: '2026-11-06', valor: -19.66, tipo: 'Débito', nome: 'Farmácia Indiana', categoria: 'Saúde',
      obs: 'Compra na farmácia.' },
    { data: '2026-11-06', valor: -463.16, tipo: 'Débito', nome: 'Supermercados BH', categoria: 'Mercado',
      obs: 'Compras de mercado.' },
    { data: '2026-11-06', valor: -19.00, tipo: 'Pix enviado', nome: 'Ariel Almeida Lopes de Oliveira', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },
    { data: '2026-11-06', valor: -10.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cigarro Paiol.' },

    // ---------------- 07/11 ----------------
    { data: '2026-11-07', valor: -108.71, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 08/11 ----------------
    { data: '2026-11-08', valor: -22.64, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-08', valor: -88.40, tipo: 'Pix enviado', nome: 'Amazon', categoria: 'Compras',
      obs: 'Utensílios para a casa.' },
    { data: '2026-11-08', valor: -41.36, tipo: 'Pix enviado', nome: 'Kakau (Ana Klara)', categoria: 'Pets',
      obs: 'Casinha de transporte para os gatos, que compramos juntos.' },
    { data: '2026-11-08', valor: -26.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cigarro e cerveja no bar.' },

    // ---------------- 09/11 ----------------
    { data: '2026-11-09', valor: -13.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-09', valor: -44.95, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação' },

    // ---------------- 10/11 ----------------
    { data: '2026-11-10', valor: -95.10, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-10', valor: -26.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cerveja e cigarro no bar.' },

    // ---------------- 11/11 ----------------
    { data: '2026-11-11', valor: 250.00, tipo: 'Pix recebido', nome: 'Melissa Tainara Correia Viana', categoria: 'Recebimentos' },
    { data: '2026-11-11', valor: 250.00, tipo: 'Pix recebido', nome: 'Melissa Tainara Correia Viana', categoria: 'Recebimentos' },
    { data: '2026-11-11', valor: -17.00, tipo: 'Débito', nome: 'Nosso Gás e Água', categoria: 'Contas da casa',
      obs: 'Água mineral.' },

    // ---------------- 12/11 ----------------
    { data: '2026-11-12', valor: -29.12, tipo: 'Boleto', nome: 'Receita Federal (DARF)', categoria: 'Impostos e tarifas' },
    { data: '2026-11-12', valor: -10.00, tipo: 'Pix enviado', nome: 'Israel Santos Barbosa', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },
    { data: '2026-11-12', valor: -103.80, tipo: 'Débito', nome: 'Burger King', categoria: 'Alimentação' },
    { data: '2026-11-12', valor: -10.00, tipo: 'Débito', nome: 'Burger King', categoria: 'Alimentação' },
    { data: '2026-11-12', valor: -12.99, tipo: 'Débito', nome: 'Americanas', categoria: 'Compras',
      obs: 'Escorredor de talheres para a casa.' },
    { data: '2026-11-12', valor: -17.00, tipo: 'Pix enviado', nome: 'Silas Israel de Souza e Silva', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },

    // ---------------- 13/11 ----------------
    { data: '2026-11-13', valor: -175.03, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-13', valor: -26.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cerveja e cigarro no bar.' },

    // ---------------- 14/11 ----------------
    { data: '2026-11-14', valor: -47.95, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 15/11 ----------------
    { data: '2026-11-15', valor: -9.00, tipo: 'Pix enviado', nome: 'Bruno Carvalho de Rezende', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },
    { data: '2026-11-15', valor: -15.00, tipo: 'Pix enviado', nome: 'Matheus Henrique de Oliveira', categoria: 'Transporte',
      obs: 'Corrida de Uber.' },

    // ---------------- 17/11 ----------------
    { data: '2026-11-17', valor: -43.96, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-17', valor: -119.21, tipo: 'Pix enviado', nome: 'Águas de Governador Valadares', categoria: 'Contas da casa',
      obs: 'Conta de água.' },
    { data: '2026-11-17', valor: -18.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cigarro no bar.' },

    // ---------------- 18/11 ----------------
    { data: '2026-11-18', valor: -55.39, tipo: 'Pix enviado', nome: 'Farmácia Indiana', categoria: 'Saúde' },
    { data: '2026-11-18', valor: -25.96, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 19/11 ----------------
    { data: '2026-11-19', valor: -72.00, tipo: 'Débito', nome: 'Marcio Rogério Higino', categoria: 'Alimentação',
      obs: 'Lanche por delivery.' },

    // ---------------- 20/11 ----------------
    { data: '2026-11-20', valor: -35.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cerveja e cigarro no bar.' },

    // ---------------- 21/11 ----------------
    { data: '2026-11-21', valor: -152.94, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-21', valor: -14.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-21', valor: -17.00, tipo: 'Débito', nome: 'Nosso Gás e Água', categoria: 'Contas da casa',
      obs: 'Galão de água mineral.' },

    // ---------------- 23/11 ----------------
    { data: '2026-11-23', valor: -23.90, tipo: 'Débito em conta', nome: 'Débito automático', categoria: 'Outros',
      nota: 'Débito de R$ 23,90 que se repete todo dia 23 (também em setembro e outubro); o extrato não diz o que é.' },
    { data: '2026-11-23', valor: -112.85, tipo: 'Pix enviado', nome: 'Claude (via Mercado Pago)', categoria: 'Assinaturas',
      obs: 'Pagamento mensal do Claude, feito pela minha conta no Mercado Pago.',
      nota: 'É um Pix para a minha própria conta, mas conta como gasto: paga a assinatura.' },
    { data: '2026-11-23', valor: -86.05, tipo: 'Boleto', nome: 'Simples Nacional (DAS)', categoria: 'Impostos e tarifas' },
    { data: '2026-11-23', valor: -23.65, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 24/11 ----------------
    { data: '2026-11-24', valor: 2050.00, tipo: 'Pix recebido', nome: 'Bruno Albiero Negócios Digitais', categoria: 'Salário e renda' },
    { data: '2026-11-24', valor: -2200.00, tipo: 'Aplicação', nome: 'RDB Nubank', categoria: 'Investimentos',
      nota: 'Dinheiro guardado; não conta como gasto.' },
    { data: '2026-11-24', valor: -25.31, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação',
      nota: 'Dois Pix iguais de R$ 25,31 para o 99 Food neste dia; vale conferir se não foi cobrança duplicada.' },
    { data: '2026-11-24', valor: -36.00, tipo: 'Débito', nome: 'Bar do Ronilson', categoria: 'Bar e cigarro',
      obs: 'Cigarro e cerveja no bar.' },
    { data: '2026-11-24', valor: -25.31, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação',
      nota: 'Dois Pix iguais de R$ 25,31 para o 99 Food neste dia; vale conferir se não foi cobrança duplicada.' },
  ],
};
