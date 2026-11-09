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
  atualizadoEm: '2026-11-09',
  extratos: [
    { conta: 'Nubank (conta)', de: '2026-11-01', ate: '2026-11-09' },
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
  ],
};
