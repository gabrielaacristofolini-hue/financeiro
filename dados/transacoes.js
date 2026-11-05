/*
 * Banco de dados do painel. Mantido pelo Claude a partir dos extratos enviados no chat.
 *
 * Cada transação: data (AAAA-MM-DD), valor (negativo = saída), tipo, nome
 * (estabelecimento/pessoa, padronizado) e categoria.
 * Categorias especiais (ver js/app.js): "Salário e renda" e "Recebimentos" são receitas;
 * "Investimentos" e "Transferência entre contas" não contam nem como receita nem como despesa.
 * Regra: despesa sem destino identificável (ex.: Pix para pessoa sem saber o motivo) vai em "Outros".
 *
 * Desde 05/11/2026 o painel considera só a partir de novembro/2026
 * (setembro e outubro ficaram fora; o extrato original está em privado/).
 */
window.FINANCAS = {
  atualizadoEm: '2026-11-05',
  extratos: [
    { conta: 'Nubank (conta)', de: '2026-11-01', ate: '2026-11-05' },
  ],
  transacoes: [
    // ---------------- novembro/2026 ----------------
    { data: '2026-11-01', valor: -100.00, tipo: 'Pix enviado', nome: 'Laura Souza Silva', categoria: 'Outros' },
    { data: '2026-11-01', valor: -20.00, tipo: 'Pix enviado', nome: 'M4 Produtos e Serviços', categoria: 'Outros' },
    { data: '2026-11-01', valor: -12.00, tipo: 'Pix enviado', nome: 'Leonizio Azevedo Dias', categoria: 'Outros' },
    { data: '2026-11-01', valor: -177.89, tipo: 'Débito', nome: 'Supermercados BH', categoria: 'Mercado' },
    { data: '2026-11-01', valor: -14.50, tipo: 'Pix enviado', nome: 'Guilherme Oliveira Silva Júnior', categoria: 'Outros' },
    { data: '2026-11-02', valor: -24.00, tipo: 'Pix enviado', nome: 'Marcelo Oliveira Santos', categoria: 'Outros' },
    { data: '2026-11-02', valor: -33.00, tipo: 'Pix enviado', nome: 'Danilo Nunes de Oliveira', categoria: 'Outros' },
    { data: '2026-11-02', valor: -25.00, tipo: 'Pix enviado', nome: 'Eduardo Henrique da Silva Rozado', categoria: 'Outros' },
    { data: '2026-11-03', valor: -300.00, tipo: 'Pix enviado', nome: 'Ana Klara Souza Silva', categoria: 'Outros' },
    { data: '2026-11-03', valor: -17.00, tipo: 'Débito', nome: 'Nosso Gás e Água', categoria: 'Contas da casa' },
    { data: '2026-11-03', valor: -17.98, tipo: 'Débito', nome: 'Juvenal Supermercado', categoria: 'Mercado' },
    { data: '2026-11-04', valor: 42.44, tipo: 'Pix recebido', nome: 'Ana Klara Souza Silva', categoria: 'Recebimentos' },
    { data: '2026-11-04', valor: -78.05, tipo: 'Pix enviado', nome: '99 Food', categoria: 'Alimentação' },
    { data: '2026-11-05', valor: 3600.00, tipo: 'Pix recebido', nome: 'JN Content Mídia Digital', categoria: 'Salário e renda' },
    { data: '2026-11-05', valor: -1031.90, tipo: 'Boleto', nome: 'Certa Imóveis (aluguel)', categoria: 'Moradia' },
    { data: '2026-11-05', valor: -437.82, tipo: 'Boleto', nome: 'Bulbe Energia', categoria: 'Contas da casa' },
  ],
};
