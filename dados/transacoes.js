/*
 * Banco de dados do painel. Mantido pelo Claude a partir dos extratos enviados no chat.
 *
 * Cada transação: data (AAAA-MM-DD), valor (negativo = saída), tipo, nome
 * (estabelecimento/pessoa, padronizado), categoria, obs (observação escrita pelo
 * Gabriel no app do banco) e, quando houver, nota (ligação com outras transações).
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
      obs: 'peguei dinheiro com Laura e paguei no Pix, depois usei esses 100 no churrasco',
      nota: 'Churrasco: junto com o Pix de R$ 33 para Danilo (02/11), total R$ 133' },
    { data: '2026-11-01', valor: -20.00, tipo: 'Pix enviado', nome: 'M4 Produtos e Serviços', categoria: 'Outros',
      obs: 'não lembro' },
    { data: '2026-11-01', valor: -12.00, tipo: 'Pix enviado', nome: 'Leonizio Azevedo Dias', categoria: 'Transporte',
      obs: 'inDrive' },
    { data: '2026-11-01', valor: -177.89, tipo: 'Débito', nome: 'Supermercados BH', categoria: 'Mercado' },
    { data: '2026-11-01', valor: -14.50, tipo: 'Pix enviado', nome: 'Guilherme Oliveira Silva Júnior', categoria: 'Transporte',
      obs: 'inDrive' },

    // ---------------- 02/11 ----------------
    { data: '2026-11-02', valor: -24.00, tipo: 'Pix enviado', nome: 'Marcelo Oliveira Santos', categoria: 'Transporte',
      obs: 'inDrive/Uber' },
    { data: '2026-11-02', valor: -33.00, tipo: 'Pix enviado', nome: 'Danilo Nunes de Oliveira', categoria: 'Lazer',
      obs: 'minha parte no churrasco, era 133; os outros 100 usei o dinheiro físico que peguei com Laura',
      nota: 'Churrasco: junto com o Pix de R$ 100 para Laura (01/11), total R$ 133' },
    { data: '2026-11-02', valor: -25.00, tipo: 'Pix enviado', nome: 'Eduardo Henrique da Silva Rozado', categoria: 'Transporte',
      obs: 'Uber / inDrive / transporte' },

    // ---------------- 03/11 ----------------
    { data: '2026-11-03', valor: -300.00, tipo: 'Pix enviado', nome: 'Ana Klara Souza Silva', categoria: 'Outros',
      obs: 'Kakau: carteira de táxi, mais Uber (pouca parte foi Uber)',
      nota: 'Voltaram R$ 42,44 de troco em 04/11; custo real R$ 257,56' },
    { data: '2026-11-03', valor: -17.00, tipo: 'Débito', nome: 'Nosso Gás e Água', categoria: 'Contas da casa',
      obs: 'galão de água' },
    { data: '2026-11-03', valor: -17.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 04/11 ----------------
    { data: '2026-11-04', valor: 42.44, tipo: 'Pix recebido', nome: 'Ana Klara Souza Silva', categoria: 'Outros',
      obs: 'troco dos 300 que mandei pra ela',
      nota: 'Troco do Pix de R$ 300 (03/11): abate o gasto em Outros, não é renda' },
    { data: '2026-11-04', valor: -78.05, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação',
      obs: 'Burger King' },

    // ---------------- 05/11 ----------------
    { data: '2026-11-05', valor: 3600.00, tipo: 'Pix recebido', nome: 'JN Content Mídia Digital', categoria: 'Salário e renda',
      obs: 'salário' },
    { data: '2026-11-05', valor: -1031.90, tipo: 'Boleto', nome: 'Certa Imóveis', categoria: 'Moradia',
      obs: 'aluguel' },
    { data: '2026-11-05', valor: -437.82, tipo: 'Boleto', nome: 'Bulbe Energia', categoria: 'Contas da casa',
      obs: 'conta de energia' },
    { data: '2026-11-05', valor: -53.00, tipo: 'Pix enviado', nome: 'Marcio Rogério Higino', categoria: 'Alimentação',
      obs: 'lanche' },

    // ---------------- 06/11 ----------------
    { data: '2026-11-06', valor: -44.77, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado',
      obs: 'mercado, verduras e ração' },
    { data: '2026-11-06', valor: -99.90, tipo: 'Pix enviado', nome: 'IBI Telecom', categoria: 'Contas da casa',
      obs: 'internet' },
    { data: '2026-11-06', valor: -407.81, tipo: 'Boleto', nome: 'Nubank (fatura do cartão)', categoria: 'Fatura do cartão',
      obs: 'cartão de crédito' },
    { data: '2026-11-06', valor: -29.29, tipo: 'Boleto', nome: 'Nubank (fatura do cartão)', categoria: 'Fatura do cartão',
      obs: 'cartão de crédito' },
    { data: '2026-11-06', valor: -12.00, tipo: 'Débito', nome: 'MP *Carloscuba70', categoria: 'Transporte',
      obs: 'Uber' },
    { data: '2026-11-06', valor: -6.00, tipo: 'Débito', nome: 'Shopping Gov. Valadares', categoria: 'Alimentação',
      obs: 'sorvete' },
    { data: '2026-11-06', valor: -19.66, tipo: 'Débito', nome: 'Farmácia Indiana', categoria: 'Saúde',
      obs: 'farmácia' },
    { data: '2026-11-06', valor: -463.16, tipo: 'Débito', nome: 'Supermercados BH', categoria: 'Mercado',
      obs: 'mercado' },
    { data: '2026-11-06', valor: -19.00, tipo: 'Pix enviado', nome: 'Ariel Almeida Lopes de Oliveira', categoria: 'Transporte',
      obs: 'Uber' },
    { data: '2026-11-06', valor: -10.00, tipo: 'Débito', nome: 'Ronilson Gonçalves (bar)', categoria: 'Bar e cigarro',
      obs: 'cigarro paiol' },

    // ---------------- 07/11 ----------------
    { data: '2026-11-07', valor: -108.71, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },

    // ---------------- 08/11 ----------------
    { data: '2026-11-08', valor: -22.64, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-08', valor: -88.40, tipo: 'Pix enviado', nome: 'Amazon', categoria: 'Compras',
      obs: 'utensílios pra casa' },
    { data: '2026-11-08', valor: -41.36, tipo: 'Pix enviado', nome: 'Ana Klara Souza Silva', categoria: 'Pets',
      obs: 'compramos uma casinha de transporte para os gatos' },
    { data: '2026-11-08', valor: -26.00, tipo: 'Débito', nome: 'Ronilson Gonçalves (bar)', categoria: 'Bar e cigarro',
      obs: 'cigarro e cerveja (essa chave é de um bar)' },

    // ---------------- 09/11 ----------------
    { data: '2026-11-09', valor: -13.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
  ],
};
